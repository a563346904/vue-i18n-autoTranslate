# eps-i18n

## 安装
```
npm i -D eps-i18n
```

## 配置webpack loader 
```js
module.exports = {
  // ... 其他配置
  module:{
    rules:[
      {
          enforce: 'pre', // 此项一定要加上 优先执行的loader
          test: /\.(js|vue)$/,
          use: [
            {
              loader: 'eps-i18n'
            }
          ],
          exclude: /node_modules/
        }
    ]
  }
}
```

## 配置eps-i18n
```js
module.exports = {
  language: ['zh', 'en'],                                                         // 需要国际化的语言种类
  exclude: [],                                                                    // 需要忽略文件
  i18nInstance: "import i18n from '@/geely-i18n/index'",                          // 国际化资源入口
  // localePath: './src/locales/lang',                                            // 国际化资源输出路径  默认 './src/locales/lang'
  // i18nInstance: "import i18n from '@/vuei18n'",                                // 国际化要注入到js里面的实例 会在js文件第一行注入
  // setMessageKey: false,                                                        // 自定义key 默认根据汉字md5  支持函数 有两个回调参数 function(key, value) {}
  // // 有appid && secret 是由百度翻译 没有则默认全部生成为中文
  // appid: "",                                                                   // 百度翻译appid  去百度开发者平台查看 http://api.fanyi.baidu.com/doc/21
  // secret: "",                                                                  // 百度翻译密钥
}
```

### cli
```shell
npx eps-i18n sync # 同步国际化资源文件
```