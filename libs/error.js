/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 16:39:36
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:19
 * @FilePath: /node-cas/libs/error.js
 * @Description: errors
 */

export class CommonError extends Error {
  constructor(message = 'unknown error', code = 500) {
    super(message)
    this.code = code
  }
}

/**
 * 无效的参数
 */
export class InvalidQueryError extends CommonError {
  constructor(message = 'Bad Request') {
    super(message, 400)
  }
}

/**
 * 身份未认证
 */
export class UnauthorizedError extends CommonError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

/**
 * 拒绝访问
 */
export class ForbiddenError extends CommonError {
  constructor(message = 'Forbidden') {
    super(message, 403)
  }
}

/**
 * 资源未找到
 */
export class NotFoundError extends CommonError {
  constructor(message = 'Not Found') {
    super(message, 404)
  }
}
