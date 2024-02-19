/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 18:35:56
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-30 16:44:08
 * @FilePath: /node-cas/middlewares/cors.js
 * @Description: file content
 */

// 跨域
export default {
  origin: function (req) {
    if (req.url === '/test') {
      // 这里可以配置不运行跨域的接口地址
      return false
    }
    return '*'
  },
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5,
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}
