const fs = require('fs')
const mergeIi8nConfig = require('../utils/mergeIi8nConfig')
const prettier = require('prettier')
const log = require('../utils/log')
const baseUtils = require('../utils/baseUtils')
const { transform } = require('../../core/index')
const LocaleFile = require('../utils/localeFile')
const axios = require("axios");
const path = require('path')

const sqlStart = "insert into EPS_SYS_INTERNATION (INTERNATION_ID,APP_CODE, KEY, VALUE, LANGUAGE_ID, LANGUAGE_VALUE, REMARK, CREATE_TIME, CREATE_BYID, CREATE_BYNAME, MODIFY_TIME, MODIFY_BYID, MODIFY_BYNAME, IF_DELETED, TYPE, LANGUAGE_DESCRIBE)";
const sqlVal = "values (EPS_SYS_INTERNATION_SEQ.NEXTVAL, '{appCode}','{key}', '{values}', null, '{lang}', '请求IPtxt_requestip', sysdate, '0', 'import',null, null, null, '0', '0', null);";
const sqlEnd = "commit;"
/**
 * 
 * @param {*} programOption 命令行参数
 * @param {*} needReplace 是否需要替换国际化字段
 */

module.exports = async function (programOption = {}) {
  // 合并配置文件
  const options = mergeIi8nConfig(programOption)

  // 指定目录类型错误
  if (!Array.isArray(options.entry) && typeof options.entry !== 'string') {
    log.error('entry must be a string or array');
    process.exit(2);
  }

  // 没有指定国际化目录
  if (!options.entry || Array.isArray(options.entry) && options.entry.length <= 0) {
    log.error('no entry is specified');
    process.exit(2);
  }

  // 国际化配置数据
  const messages = {}

  // 获取所有入口文件路劲
  let targetFiles = baseUtils.getSourceFiles(options)
  // 开始读取文件进行操作
  for (let i = 0; i < targetFiles.length; i++) {
    const sourceCode = fs.readFileSync(targetFiles[i].filePath, 'utf8');
    let code = transform({ code: sourceCode, targetFile: targetFiles[i], options, messages })
    if (programOption.replace) {
      code = prettier.format(code, baseUtils.getPrettierOptions(targetFiles[i].ext, options))
      fs.writeFileSync(targetFiles[i].filePath, code, { encoding: 'utf-8' })
    }
    log.success(`done: ${targetFiles[i].filePath}`)
  }

  Promise.all([
    axios.get(`${options.baseUrl}/eps/config/i18n-from-config/cache/zh_CN`),
    axios.get(`${options.baseUrl}/eps/config/i18n-from-config/cache/en_US`),
    ]
  ).then(res => {
    let originData = {'zh': {}, 'en': {}}
    if(res[0].data.code === 'success' && res[1].data.code === 'success') {
      originData.zh = res[0].data.data;
      originData.en = res[1].data.data;
    }
    // 创建生成国际化文件对象
    const localeFile = new LocaleFile(options.localePath)
    // 生成配置文件
    createTasks = options.language.map(locale => {
      let data = localeFile.getConf(locale, options)
      data = baseUtils.mergeMessages(data, messages)
      return localeFile.createConf(data, locale, options, originData)
    })

    let lanauageMap = {
      'zh': 'zh_CN',
      'en': 'en_US'
    }
    
    Promise.all(createTasks).then(res => {
      let str = '';

      res.forEach(obj => {
        Object.keys(obj.data).forEach(key => {
          str += sqlStart + '\n'
          str += `values (EPS_SYS_INTERNATION_SEQ.NEXTVAL, '${options.moduleName}','${key}', '${obj.data[key]}', null, '${lanauageMap[obj.locale]}', '请求IPtxt_requestip', sysdate, '0', 'import',null, null, null, '0', '0', null); \n`;
          str += sqlEnd + '\n'
        })
      })

      if(!str) {
        console.log('没有新的国际化文字')
        return
      }
      const filePath = path.join(process.cwd(), 'sql.txt')
      fs.writeFile(filePath, str, err => {
        console.log('sql更新成功')
      });
    })

    
    
    log.success('生成国际化配置收集完成')
  }).catch(err => {
    console.log('国际化错误')
  })
}