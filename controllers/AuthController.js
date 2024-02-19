/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-11 17:11:32
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-30 16:40:59
 * @FilePath: /node-cas/controllers/AuthController.js
 * @Description: authentication api
 */

import { AuthService, UserService, ApplicationService } from '#services'
import { USER_STATUS } from '#constants'
import utils from '#utils'
import { sign, withdraw } from '#middlewares/auth-jwt.js'
import { InvalidQueryError } from '#libs/error.js'
// import redis from '#libs/redis.js'

/**
 * 获取用户信息需要验证登录
 */
export default {
  'POST /user/login': async (req, res) => {
    const { ip } = req
    const { username, password } = req.body

    if (!username || !password) throw new InvalidQueryError()

    let user
    // 邮箱登录
    if (/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(username)) {
      user = await AuthService.selectOne({ email: username })
    } else {
      user = await AuthService.selectOne({ username })
    }

    if (!user) {
      res.error = `用户不存在`
      return
    }

    const { id, status } = user

    // account locked
    if (status === USER_STATUS.LOCKED) {
      res.code = 403
      res.error = '用户已被锁定'
      return
    }

    // account cancelled
    if (status === USER_STATUS.CANCELLED) {
      res.code = 403
      res.error = '用户已被注销'
      return
    }

    // only allow to login on a single IP
    // if (config.singleLogin) {
    //   const userHeart = await redis.get('heart_user_' + id)
    //   if (userHeart && JSON.parse(userHeart).ip !== ip) {
    //     res.error = '用户已在其他地方登录'
    //     return
    //   }
    // }

    const pwd = config.encrypt ? utils.decrypt(password) : password
    if (user.password !== utils.md5(pwd)) {
      res.error = '密码错误'
      return
    }

    const time = new Date().getTime()
    const token = await sign(req, { id, ip, time })

    if (status === USER_STATUS.INACTIVE) {
      if (!config.forceChangePwd) {
        await UserService.updateById(id, { status: USER_STATUS.ACTIVE })
        AuthService.insertBehavior(id, '用户', '用户账号激活', ip)
      }
    } else {
      AuthService.insertBehavior(id, '登录', '通过账号密码登录', ip)
    }

    res.result = token
  },

  'GET /user/me': async (req, res) => {
    const { ip, userContext } = req
    const { id } = userContext

    const result = await UserService.selectWithRolesAndGroups({ id })
    result.roles = result.roles?.split(',') || []
    result.groups = result.groups?.split(',') || []

    const require_change_pwd = config.forceChangePwd && result.status === USER_STATUS.INACTIVE

    AuthService.insertBehavior(id, '用户', '获取用户权限', ip)
    res.result = require_change_pwd ? { require_change_pwd } : result
  },

  'PUT /user/password/first': async (req, res) => {
    const { ip, userContext } = req
    const { id } = userContext
    const { newPassword, oldPassword } = req.body || {}

    if (!newPassword || !oldPassword) throw new InvalidQueryError()

    if (!/^(?=A-Za-z])(?=.*\d)[\w]{8,16}$/.test(newPassword)) {
      res.error = '密码需以字母开头，包含字母和数字，长度为8-16位'
      return
    }

    const user = await AuthService.selectById(id)

    if (user.status !== USER_STATUS.INACTIVE) {
      res.error = '用户已激活'
      return
    }

    const oldMd5Password = utils.md5(oldPassword)
    const newMd5Password = utils.md5(newPassword)

    if (oldMd5Password !== user.password) {
      res.error = '原密码错误'
    } else if (oldMd5Password === newMd5Password) {
      res.error = '新密码不能与原密码相同'
    } else if (newPassword === utils.decrypt(config.defaultPassword)) {
      res.error = '新密码不能与默认密码相同'
    } else {
      await AuthService.updateById(id, { password: newMd5Password, status: USER_STATUS.ACTIVE })
      AuthService.insertBehavior(id, '用户', '修改默认密码，激活账户', ip)

      delete user.password

      res.result = user
    }
  },

  'GET /user/info': async (req, res) => {
    const { ip, userContext } = req
    const { id } = userContext

    const user = await UserService.selectBaseById(id)

    AuthService.insertBehavior(id, '用户', '获取用户信息', ip)
    res.result = user
  },

  'PUT /user/info': async (req, res) => {
    const { ip, userContext } = req

    const { id } = userContext
    const { nickname, email, phone } = req.body

    await UserService.updateById(id, { nickname, email, phone })
    const user = await UserService.selectBaseById(id)

    AuthService.insertBehavior(id, '用户', '修改用户信息', ip)
    res.result = user
  },

  /**
   * 修改密码
   */
  'PUT /user/password': async (req, res) => {
    const { ip, userContext } = req
    const { id } = userContext
    const { newPassword, oldPassword } = req.body || {}

    if (!newPassword || !oldPassword) throw new InvalidQueryError()

    if (!/^(?=A-Za-z])(?=.*\d)[\w]{8,16}$/.test(newPassword)) {
      res.error = '密码需以字母开头，包含字母和数字，长度为8-16位'
      return
    }

    const user = await AuthService.selectById(id)
    const oldMd5Password = utils.md5(oldPassword)
    const newMd5Password = utils.md5(newPassword)

    if (oldMd5Password !== user.password) {
      res.error = '原密码错误'
    } else if (oldMd5Password === newMd5Password) {
      res.error = '新密码不能与原密码相同'
    } else if (newPassword === utils.decrypt(config.defaultPassword)) {
      res.error = '新密码不能与默认密码相同'
    } else {
      await AuthService.updateById(id, { password: newMd5Password })
      AuthService.insertBehavior(id, '修改密码', '修改密码', ip)

      delete user.password

      res.result = user
    }
  },

  'GET /user/logout': async (req, res) => {
    const id = await withdraw(req, res)

    const { ip } = req
    AuthService.insertBehavior(id, '退出登录', '退出登录', ip)
    res.result = id
  },

  /**
   * 心跳检测
   */
  'GET /user/heart': async (req, res) => {
    const { id } = req.userContext
    // await redis.expire('heart_user_' + id, 60)

    res.result = null
  },

  /**
   * 获取用户关联的应用
   */
  'GET /user/applications': async (req, res) => {
    const { ip, userContext } = req
    const { id } = userContext
    const groupIds = await UserService.selectUserGroupIds(id)

    let result = []
    if (groupIds.length) {
      result = await ApplicationService.selectByGroupIds(groupIds)
    }

    AuthService.insertBehavior(id, '用户', '获取关联应用', ip)
    res.result = result
  },

  'POST /user/behavior': async (req, res) => {
    const { ip, userContext } = req
    const { type, description } = req.body

    if (!type || !description) throw new InvalidQueryError()

    await AuthService.insertBehavior(userContext.id, type, description, ip)
    res.body = null
  },
}
