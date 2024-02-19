/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 18:35:50
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:26:56
 * @FilePath: /node-cas/middlewares/response.js
 * @Description: file content
 */

import { STATUS_CODES } from 'node:http'

/**
 * Handle response.
 * The res.result and res.error are shorthand for res.body, while res.status and res.type will be set automatically.
 * But if res.body is set, res.result and res.error will be ignored.
 * @param {http.req} req
 * @param {http.res} res
 */
export const responseHandler = (req, res) => {
  const { status, body, result, error } = res

  if (body !== undefined) return // body can be set to null

  if (result !== undefined) {
    res.status = status || 200
    res.body = result
  } else if (error !== undefined) {
    res.status = status || 500
    res.body = { message: error }
  }
}

/**
 * Handle error and send error message to client.
 * Handle 404, 413 and etc errors quickly.
 * @param {Error} err
 * @param {http.req} req
 * @param {http.res} res
 * @returns Promise.resolve()
 */
export const errorHandler = (err, req, res) => {
  const { code, message, stack } = err

  if (Number.isInteger(code) && STATUS_CODES[code]) {
    res.status = code
    res.body = message
  } else {
    logger.error(stack)
    res.status = 500
    res.body = message || stack
  }

  return Promise.resolve()
}
