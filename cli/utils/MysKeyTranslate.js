const md5 = require("./md5");
const axios = require("axios");

function MysKeyTranslate(config) {
  this.requestNumber = 0;
  this.config = {
    showProgress: true,
    requestNumber: 1,
    agreement: 'http',
    ...config,
  };
  this.baiduApi = `${this.config.agreement}://api.fanyi.baidu.com/api/trans/vip/translate`

  this.createUrl = (domain, form) => {
    let result = domain + "?";
    for (let key in form) {
      result += `${key}=${form[key]}&`;
    }
    return result.slice(0, result.length - 1);
  };

  this.requestApi = (value, parames) => {
    if (this.requestNumber >= this.config.requestNumber) {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.requestApi(value, parames).then((res) => {
            resolve(res);
          });
        }, 1000);
      });
    }
    this.requestNumber++;
    const { appid, secret } = this.config;
    const q = value;
    const salt = Math.random();
    const sign = md5.MD5(`${appid}${q}${salt}${secret}`);
    const fromData = {
      ...parames,
      q: encodeURIComponent(q),
      sign,
      appid,
      salt,
    };
    const fanyiApi = this.createUrl(this.baiduApi, fromData);
    // console.log("fanyiApi", fanyiApi);
    return new Promise((resolve) => {
      axios
        .get(fanyiApi)
        .then(({ data: res }) => {
          // if (this.config.showProgress) console.log("翻译结果：", res);
          if (!res.error_code) {
            const resList = res.trans_result;
            resolve(resList);
          }
        })
        .finally(() => {
          setTimeout(() => {
            this.requestNumber--;
          }, 1000);
        });
    });
  };

  this.translate = async (value, parames = { from: "zh", to: "en" }) => {
    let result = "";
    if (typeof value === "string") {
      const res = await this.requestApi(value, parames);
      result = res[0]["dst"];
    }
    if (
      Array.isArray(value) ||
      Object.prototype.toString.call(value) === "[object Object]"
    ) {
      result = await this._createObjValue(value, parames);
    }
    return result;
  };

  this._createObjValue = async (value, parames) => {
    let index = 0;
    const obj = Array.isArray(value) ? [] : {};
    const strDatas = Array.isArray(value) ? value : Object.values(value);
    const reqData = strDatas
      .filter((item) => typeof item === "string")
      .join("\n");
    const res = reqData ? await this.requestApi(reqData, parames) : [];
    for (let key in value) {
      if (typeof value[key] === "string") {
        obj[key] = res[index]["dst"];
        index++;
      }
      if (
        Array.isArray(value[key]) ||
        Object.prototype.toString.call(value[key]) === "[object Object]"
      ) {
        obj[key] = await this.translate(value[key], parames);
      }
    }
    return obj;
  };

  return this.translate;
}

module.exports = MysKeyTranslate;