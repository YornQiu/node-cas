/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-08 16:54:38
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-02-02 11:26:11
 * @FilePath: /node-cas/middlewares/auth.js
 * @Description: file content
 */

import { UserService } from '#services'
import { USER_GROUPS } from '#constants'
import utils from '#utils'
import redis from '#libs/redis.js'
import { UnauthorizedError, ForbiddenError } from '#libs/error.js'

const EXP = config.tokenConfig.expired //s
const maxAge = config.tokenConfig.maxAge //ms

export const sign = async (res, payload) => {
  const uid = 'user_' + payload.id
  const token = utils.encrypt(uid)

  await redis.set(uid, JSON.stringify(payload), { EX: EXP })

  res.cookies.set('uid', token, { maxAge })

  return token
}

export const verify = async (req) => {
  if (req.path === '/cas/user/login') return

  const token = req.cookies.get('uid')
  const uid = utils.decrypt(token)
  const payload = await redis.get(uid)
  if (!payload) {
    throw new UnauthorizedError()
  }

  req.userContext = JSON.parse(payload)
  await redis.expire(uid, EXP)
}

export const withdraw = async (req) => {
  const token = req.cookies.get('uid')
  const uid = utils.decrypt(token)
  await redis.del(uid)

  return uid.substring(5)
}

export const verifyAudit = async (req) => {
  const token = req.cookies.get('uid')
  const uid = utils.decrypt(token)
  const payload = await redis.get(uid)

  if (!payload) {
    throw new UnauthorizedError()
  }

  const payloadObject = JSON.parse(payload)
  const groupIds = await UserService.selectUserGroupIds(payloadObject.id)

  if (!groupIds.includes(USER_GROUPS.AUDIT) && !groupIds.includes(USER_GROUPS.ADMIN)) {
    throw new ForbiddenError()
  }

  req.userContext = payloadObject
  await redis.expire(uid, EXP)
}

export const verifyAdmin = async (req) => {
  const token = req.cookies.get('uid')
  const uid = utils.decrypt(token)
  const payload = await redis.get(uid)

  if (!payload) {
    throw new UnauthorizedError()
  }

  const payloadObject = JSON.parse(payload)
  const groupIds = await UserService.selectUserGroupIds(payloadObject.id)

  if (!groupIds.includes(USER_GROUPS.ADMIN)) {
    throw new ForbiddenError()
  }

  req.userContext = payloadObject
  await redis.expire(uid, EXP)
}
