const path = require('path')
const program = require('commander')
const collect = require('./command/collect')
const package = require('../package')

// 用法 版本说明
program
  .version(package.version) // 定义版本
  .usage('<command>') // 定义用法


// 同步国际化配置文件并替换为对应的国际化字段
program
  .command('sync') // 定义命令
  .alias('s') // 命令别名
  .description('Synchronize the Chinese configuration to the internationalization profile') // 对命令参数的描述信息
  .option('-r, --replace', 'Replace Internationalization Fields') // 替换国际化字段 如果为true 会写入源文件 默认为false
  .action(function (options) {
    collect(options)
  })
  .on('--help', function () {
    console.log('  Examples:');
    console.log('    $ autoi18n sync')
  })

program.parse(process.argv)
