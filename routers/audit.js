/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 15:40:22
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-02-19 15:11:26
 * @FilePath: /node-cas/routers/audit.js
 * @Description: file content
 */

import { AuditController } from '#controllers'
import { verifyAudit } from '#middlewares/auth-jwt.js'
import { Router } from 'veloc'

const router = new Router()
const { methods } = router

/**
 * Audit接口，audit用户可以访问
 */
router.use(verifyAudit)

router.prefix('/cas/audit')

for (const url in AuditController) {
  const [method, path] = url.split(' ')
  if (methods.includes(method)) {
    router[method.toLocaleLowerCase()](path, AuditController[url])
  } else {
    logger.error(`Invalid URL: ${url}`)
  }
}

logger.info('Audit routes registered')

export default router
