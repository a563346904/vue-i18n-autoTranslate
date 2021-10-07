const path = require('path')
const cwdPath = process.cwd()
const mergeIi8nConfig = require('../cli/utils/mergeIi8nConfig');
const { transform } = require('../core/index')
let messages = {}

/**
 * 目前只开放五个参数
 * @param { Object } this.query 
 * language exclude localePath i18nInstance setMessageKey
 */
module.exports = function (source) {
  let configOptions = mergeIi8nConfig();
  configOptions = Object.assign(configOptions, this.query);

  // 忽略处理文件
  let isIgnore = ignoreFile(configOptions, this.resourcePath);
  if(isIgnore)  return source

  targetFile = { ext: path.extname(this.resourcePath), filePath: this.resourcePath }
  source = transform({ code: source, targetFile, options: configOptions, messages })
  messages = {}
  return source
}

function ignoreFile(configOptions, resourcePath) {
  if(configOptions && !configOptions.exclude)  return false;

  for(let i = 0; i < configOptions.exclude.length; i++) {
    let file = configOptions.exclude[i];
    if(resourcePath.includes(path.resolve(cwdPath, file))) {
      return true;
    } 
  }

  return false;
}