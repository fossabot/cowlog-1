const mockData = require('../mockData')
const cowlog = require('../../src/index')()

cowlog.log(mockData.abcString, 'barvalue2')('die')

console.log('yay')
