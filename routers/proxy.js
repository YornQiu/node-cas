/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-15 12:11:11
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-02-19 15:11:35
 * @FilePath: /node-cas/routers/proxy.js
 * @Description: file content
 */

import { createProxyMiddleware } from 'http-proxy-middleware'
import { verify } from '#middlewares/auth-jwt.js'
import { Router } from 'veloc'

const router = new Router()

router.use(verify)

router.use(
  '/api/*',
  createProxyMiddleware({
    target: 'http://localhost:8080',
    changeOrigin: true,
  }),
)

export default router
