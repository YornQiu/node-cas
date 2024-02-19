/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 16:47:18
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:29:46
 * @FilePath: /node-cas/config/config.js
 * @Description: base config
 */

import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_NAME = JSON.parse(readFileSync(resolve(__dirname, '../package.json'))).name

export default {
  name: PROJECT_NAME,
  port: 3000,
  tokenConfig: {
    secret: 'node_cas_2024',
    expired: 60 * 60 * 24 * 1, // 1d, token失效时间
    maxAge: 60 * 60 * 24 * 2, // 2d, token重签时间
  },
  singleLogin: false, // 是否限制只允许在一个地点登录，默认不限制
  encrypt: false, // 是否使用加密算法处理前端发送的密码，默认不处理
  encryptSecret: 'node_cas_2024', // 加密算法密钥
  randomPwd: false, // 是否使用随机密码，默认不使用
  forceChangePwd: true, // 是否强制修改密码，默认不强制
  defaultPwd: 'U2FsdGVkX18upJw8WOE8na494HMvz2IK5RtiIWZ07FY=', // 默认密码
  publicDir: resolve(__dirname, '../public'), // 资源文件路径
  viewsDir: resolve(__dirname, '../views'), // 静态页面文件路径
  logPath: resolve(__dirname, `../logs/${PROJECT_NAME}`), // 日志文件路径
  redis: {
    host: '192.168.8.139',
    port: 16379,
    db: 5,
  },
  mysql: {
    host: '172.17.100.144',
    port: 3306,
    user: 'root',
    pwd: '11111111',
    db: 'node_cas',
  },
}
