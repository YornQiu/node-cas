/*
 * @Author: Yorn Qiu
 * @Date: 2024-01-08 15:42:08
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-30 16:43:54
 * @FilePath: /node-cas/middlewares/auth-jwt.js
 * @Description:
 */

import jwt from 'jsonwebtoken'
import { UserService } from '#services'
import { USER_GROUPS } from '#constants'
import { UnauthorizedError, ForbiddenError } from '#libs/error.js'

const EXP = config.tokenConfig.expired //s
const MAXAGE = config.tokenConfig.maxAge //s
const secret = config.tokenConfig.secret

export const sign = async (req, payload) => {
  return {
    token_type: 'Bearer',
    access_token: jwt.sign(
      {
        data: payload,
        exp: Math.floor(Date.now() / 1000) + EXP,
      },
      secret,
    ),
    refresh_token: jwt.sign(
      {
        data: payload,
        exp: Math.floor(Date.now() / 1000) + MAXAGE,
      },
      secret,
    ),
  }
}

export const verify = (req) => {
  if (req.path === '/cas/user/login') return

  try {
    if (typeof req.request.headers.authorization === 'string') {
      const token = req.request.headers.authorization.slice(7)
      const { data } = jwt.verify(token, secret)
      req.userContext = data
      return data
    } else {
      throw new UnauthorizedError()
    }
  } catch (err) {
    throw new UnauthorizedError()
  }
}

export const withdraw = async (req) => {
  const userContext = verify(req)

  return userContext
}

export const verifyAudit = async (req) => {
  const userContext = verify(req)

  const groupIds = await UserService.selectUserGroupIds(userContext.id)

  if (!groupIds.includes(USER_GROUPS.AUDIT) && !groupIds.includes(USER_GROUPS.ADMIN)) {
    throw new ForbiddenError()
  }
}

export const verifyAdmin = async (req) => {
  const userContext = verify(req)
  const groupIds = await UserService.selectUserGroupIds(userContext.id)

  if (!groupIds.includes(USER_GROUPS.ADMIN)) {
    throw new ForbiddenError()
  }
}
