/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 16:53:33
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 14:48:26
 * @FilePath: /node-cas/middlewares/logger.js
 * @Description: file content
 */

import { parse } from 'path'
import { existsSync, mkdirSync } from 'fs'
import log4js from 'log4js'
import config from '#root/config/index.js'

const logsDir = parse(config.logPath).dir

if (!existsSync(logsDir)) {
  mkdirSync(logsDir)
}

log4js.configure({
  appenders: {
    console: { type: 'console' },
    dateFile: {
      type: 'dateFile',
      filename: config.logPath,
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
    },
  },
  categories: {
    default: {
      appenders: ['console', 'dateFile'],
      level: 'info',
    },
  },
})

export const logger = log4js.getLogger()

export const loggerMiddleware = async (req, res) => {
  const start = new Date()
  const { ip, headers, method, url, body } = req
  const remoteAddress = headers['x-forwarded-for'] || ip

  const onFinishOrClose = () => {
    const ms = new Date() - start
    const { status } = res

    if (status === 500) {
      logger.error(
        `${method} ${status} ${url} Request: ...  Responce: ${JSON.stringify(res.body)} - ${remoteAddress} - ${ms}ms`,
      )
    } else {
      const request = body === undefined ? 'undefined' : '...'
      const responce = res.body === undefined ? 'undefined' : '...'
      logger.info(`${method} ${status} ${url} Request: ${request}  Responce: ${responce} - ${remoteAddress} - ${ms}ms`)
    }
  }

  res.once('finish', onFinishOrClose)
}
