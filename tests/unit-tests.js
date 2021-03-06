/* eslint-env mocha */
require('./lib/test-common')
const assert = require('chai').assert
const path = require('path')
const tmpDir = path.join(__dirname, '../tmp/')
const mockData = require('./mockData')
const fs = require('fs')
const stlc = require('./lib/string-to-line-increasing-checker')
const sttlm = require('../src/lib/misc/linker/substing-to-line-mapper')
const copyFileSync = require('fs-copy-file-sync')
const _ = require('lodash')
let sourcePath = ''
process.env.PROD ? sourcePath = 'dist' : sourcePath = 'src'
const appContainer = require(`../${sourcePath}/app/container`)()
const readmeFileName = appContainer.readmeFileName

const expect = require('chai').expect
require('chai').should()

describe('lib unit tests', function () {

  this.timeout(100000)

  describe('hash-creator', function () {
    it('shall provide a hash', function () {
      let hashCreator = appContainer['hash-creator']
      let hash = hashCreator('abc')
      hash.should.be.a('string')
      var hexCheck = new RegExp(/^[0-9A-Fa-f]+$/)
      expect(hexCheck.test(hash)).to.equal(true)
      hash.should.to.equal(mockData.abcHash)
    })
  })

  describe('logfile-creator', function () {
    it('shall create a logfile', function () {
      let logFileCreator = require(`../${sourcePath}/lib/logfile-creator`)(tmpDir)
      let abcHashPath = logFileCreator('abc')
      abcHashPath.should.be.a('string').that.does.include('/tmp/')
        .and.that.does.include('/7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
        .and.that.does.include('/ba/')
        .and.that.does.include('_.log')
      assert(fs.existsSync(abcHashPath), 'logfile does not exists')
    })

    it('shall create a logfile with a different @extension', function () {
      let logFileCreator = require(`../${sourcePath}/lib/logfile-creator`)(tmpDir)
      let abcHashPath = logFileCreator('abc', '.js')
      abcHashPath.should.be.a('string').that.does.include('/tmp/')
        .and.that.does.include('.js')
    })
  })

  describe('plugin-loader', function () {
    it('shall test loading plugins passed as objects form the config', function () {
      let parameters = 'default'
      let calculatedParameters = require(`../${sourcePath}/app/configParser/configParser`)(parameters)
      calculatedParameters.plugins = [require(`../${sourcePath}/plugins/logDetails`)]
      // // const appContainer =
      require(`../${sourcePath}/app/container`)(calculatedParameters)
    })

    it('shall test loading plugins', function () {
      let parameters = 'default'
      let calculatedParameters = require(`../${sourcePath}/app/configParser/configParser`)(parameters)
      calculatedParameters.plugins = ['logDetails']
      // const appContainer =
      require(`../${sourcePath}/app/container`)(calculatedParameters)
    })
  })

  describe('@linker', function () {
    it('test liner', function () {
      let linker = require('../src/lib/misc/linker/linker')

      let result = linker(`
      bla-bla
      AAA
      ---
      BBB
      
      alb-alb

      `, 'AAA', 'BBB', '+++')

      result.should.be.a('string').that.does.not.include('---')
      stlc(result, ['bla-bla', 'AAA', '+++', 'BBB', 'alb-alb'])
    })

    it('test linker with more tags', function () {
      let linker = require('../src/lib/misc/linker/linker')

      let result = linker(`
      bla-bla
      AAA
      ---
      BBB
      
      AAA
      ---
      BBB
      
      alb-alb

      `, 'AAA', 'BBB', '+++')

      result.should.be.a('string').that.does.not.include('---')

      expect(sttlm(result, '+++')).to.have.property('length', 2)
      expect(sttlm(result, 'AAA')).to.have.property('length', 2)
      expect(sttlm(result, 'BBB')).to.have.property('length', 2)

      stlc(result, ['bla-bla', 'AAA', '+++', 'BBB', 'alb-alb'])

    })

    it('no opening tag', function () {
      let linker = require('../src/lib/misc/linker/linker')

      expect(function () {
        linker(`
              bla-bla
              ---
              BBB
              
              alb-alb
        
              `, 'AAA', 'BBB', '+++')
      }).to.throw('The number linker closing tags and starting tags are not matching')

    })

    it('no closing tag', function () {
      let linker = require('../src/lib/misc/linker/linker')

      expect(function () {
        linker(`
        bla-bla
        AAA
        ---
        
        alb-alb
  
        `, 'AAA', 'BBB', '+++')
        }).to.throw('The number linker closing tags and starting tags are not matching')
    })

    describe('test @linker-file', function () {
      it('changed content', function () {
        let linker = require('../src/lib/misc/linker/linker-file')
        let tmpFile = path.join(process.cwd(), 'tmp', readmeFileName)
        copyFileSync(path.join(process.cwd(), readmeFileName), tmpFile)
        let result = linker(tmpFile, '<!--- example begin -->', '<!--- example end -->', '+++')
        result.should.be.a('string').that.does.include('+++')
          .and.does.not.include('oO')
      })
      it('not changed content', function () {
        let linker = require('../src/lib/misc/linker/linker-file')
        let tmpFile = path.join(process.cwd(), 'tmp', readmeFileName)
        copyFileSync(path.join(process.cwd(), readmeFileName), tmpFile)
        let result = linker(tmpFile, '<!-- example begin -->', '<!-- example end -->', '+++')
        expect(result).to.equal('')
      })
    })

    it('test @liker-dir', function () {
      let linker = require('../src/lib/misc/linker/linker-dir')
      let tmpdir = path.join(process.cwd(), 'tmp')
      let tmpFile = path.join(tmpdir, readmeFileName)
      copyFileSync(path.join(process.cwd(), readmeFileName), tmpFile)

      let results = linker(tmpdir, '<!--- example begin -->', '<!--- example end -->', '+++***---')
      let keys = Object.keys(results)
      expect(keys.length).to.equal(1)
      results[keys[0]].should.include('+++***---')
    })
  })
})
