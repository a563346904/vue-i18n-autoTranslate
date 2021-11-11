const fs = require('fs')
const path = require('path')
const log = require('./log')

const MysKeyTranslate = require("./MysKeyTranslate.js"); 

let translate = null;

const cwdPath = process.cwd()

/**
 * 同步创建多级文件夹
 * @param {*} dirname 文件名
 * @returns 
 */
const mkdirMultipleSync = (dirname) => {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirMultipleSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

/**
   * 使用百度翻译将对应语言翻译
   */
const baiduApiReplace = (configFilePath, moduleIdent, values, locale) => {
  return new Promise(resolve => {
    let objIndex = 0;
    let objList = [];
    let obj = {}
    Object.keys(values).forEach(key => {
      if (/[\u4e00-\u9fa5]+/g.test(values[key])) {
        obj[key] = values[key];
        objList[objIndex] = JSON.parse(JSON.stringify(obj));
        if(Object.keys(obj).length > 30) {
          obj = {};
          objIndex++;
        }      
      }
    })

    async function execute() {
      const args = [].slice.call(arguments, 0)
      for (let item of args) {
        let res = await translate(item, { from: "zh", to: locale })
        values = Object.assign(values, res)
        console.log('翻译中...')
      }
      fs.writeFile(configFilePath, moduleIdent + JSON.stringify(values, null, 2), err => {
        if (err) {
          console.log(err);
          reject();
        }
      });
      resolve()
      log.success(`${locale}国际化文件生成成功`);  
    }

    if(objList.length == 0) {
      log.success(`${locale}国际化文件生成成功`);
      resolve()
      return;
    }
    execute(...objList);
  })
}

module.exports = class LocaleFile {
  constructor(folder) {
    this.localesDir = folder;
  }

  /**
   * 创建一个配置
   * @param {object} values    KV值
   * @param {string} locale    locales标识
   * @param {object} options   自动国际化配置对象
   */
  createConf(values, locale, options) {
    return new Promise((resolve, reject) => {
      const folder = (
        this.localesDir.startsWith('/')
          ? this.localesDir
          : path.join(cwdPath, this.localesDir)
      );
      try {
        fs.accessSync(folder)
      } catch (e) {
        mkdirMultipleSync(folder)
      }
      const localeFileExt = options.localeFileExt || '.json'
      const configFilePath = path.join(folder, `${locale}${localeFileExt}`);

    
      let moduleIdent = options.modules === 'commonjs' ? 'module.exports = ' : 'export default '
      moduleIdent = localeFileExt === '.json' ? '' : moduleIdent
      
      const { appid, secret } = options
      if(appid && secret && locale !== 'zh') {
        translate = new MysKeyTranslate({
          appid,
          secret
        });
        baiduApiReplace(configFilePath, moduleIdent, values, locale).then(_ => {
          resolve(configFilePath)
        })
      } else {
        fs.writeFile(configFilePath, moduleIdent + JSON.stringify(values, null, 2), err => {
          if (err) {
            reject(err);
          } else {
            log.success(`${locale}国际化文件生成成功`);  
            resolve(configFilePath);
          }
        });
      }
    });
    
  }

  /**
   * 获取配置值
   * @param {string} locale  key
   * @param {object} options   自动国际化配置对象
   */
  getConf(locale, options) {
    const localeFileExt = options.localeFileExt || '.json'
    const configFilePath = path.join(cwdPath, this.localesDir, `${locale}${localeFileExt}`);
    let data = {}
    if (fs.existsSync(configFilePath)) {
      let content = fs.readFileSync(configFilePath, { encoding: 'utf-8' })
      // 匹配大括号里面的内容
      content = (content || '').match(/\{[\s\S]*\}/)
      content = content ? content[0] : {}
      // 将key value的单引号换成双引号 防止json格式化失败
      content = content.replace(/(['"]?)(\w+)\1\s*:\s*(['"]?)(((?!,|\3)(.|\n|\r))+)\3/gm, (match, keySign, key, valueSign, value) => {
        value = valueSign ? `"${value}"` : value
        return `"${key}": ${value}`
      })
      data = content.length > 0 ? JSON.parse(content) : {}
    }
    return data
  }
}
