/*
 * @Author: Yorn Qiu
 * @Date: 2024-01-10 15:15:52
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:28:49
 * @FilePath: /node-cas/test.js
 * @Description:
 */

import CryptoJS from 'crypto-js'

const pwd = 'techfin20240101'

const md5 = CryptoJS.MD5('techfin20240101').toString()

const encrypt = CryptoJS.AES.encrypt(pwd, 'node_cas_2024').toString()

console.log(md5)

console.log(encrypt)

console.log(CryptoJS.AES.decrypt(encrypt, 'node_cas_2024').toString(CryptoJS.enc.Utf8))
console.log(
  CryptoJS.AES.decrypt('U2FsdGVkX1+ywsjUEcGnAl4Ijmw7mLLL4RXaCrZyykA=', 'AUTH_SECRET').toString(CryptoJS.enc.Utf8),
)
