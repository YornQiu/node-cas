/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 15:40:22
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-02-19 16:53:45
 * @FilePath: /node-cas/routers/admin.js
 * @Description: file content
 */

import { AdminController } from '#controllers'
import { verifyAdmin } from '#middlewares/auth-jwt.js'
import { Router } from 'veloc'

const router = new Router()
const { methods } = router

/**
 * Admin接口，admin用户可以访问
 */
router.use(verifyAdmin)

router.prefix('/cas/admin')

for (const url in AdminController) {
  const [method, path] = url.split(' ')
  if (methods.includes(method)) {
    router[method.toLocaleLowerCase()](path, AdminController[url])
  } else {
    logger.error(`Invalid URL: ${url}`)
  }
}

logger.info('Admin routes registered')

export default router
