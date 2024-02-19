/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 15:40:22
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-02-19 15:11:31
 * @FilePath: /node-cas/routers/auth.js
 * @Description: file content
 */

import { AuthController } from '#controllers'
import { verify } from '#middlewares/auth-jwt.js'
import { Router } from 'veloc'

const router = new Router()
const { methods } = router

/**
 * 公开接口，可直接访问
 */
router.use(verify)

router.prefix('/cas')

for (const url in AuthController) {
  const [method, path] = url.split(' ')
  if (methods.includes(method)) {
    router[method.toLocaleLowerCase()](path, AuthController[url])
  } else {
    logger.error(`Invalid URL: ${url}`)
  }
}

logger.info('Public routes registered')

export default router
