/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-11 17:11:57
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-30 16:38:07
 * @FilePath: /node-cas/controllers/AuditController.js
 * @Description: audit api
 */

import { UserService, AuthService, RoleService, GroupService, ApplicationService } from '#services'
import { USER_STATUS, BUILDIN_USERS } from '#constants'
import utils from '#utils'
import { InvalidQueryError } from '#libs/error.js'

/**
 * 读取、更改用户状态需要audit权限
 */
export default {
  /**
   * user manage
   */

  'PUT /user/logout/:id': async (req, res) => {
    const { id } = req.params

    AuthService.insertBehavior(req.userContext.id, '管理用户状态', `登出用户:${id}`, req.ip)

    res.result = id
  },

  'PUT /user/:id/status': async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    if (Object.values(USER_STATUS).indexOf(status) === -1) throw new InvalidQueryError('用户状态错误')

    await UserService.updateUserStatus(id, status)

    const desc = {
      [USER_STATUS.ACTIVE]: '解锁',
      [USER_STATUS.LOCKED]: '锁定',
      [USER_STATUS.CANCELLED]: '注销',
    }[status]
    AuthService.insertBehavior(req.userContext.id, '管理用户状态', `${desc}用户:${id}`, req.ip)

    res.result = id
  },

  'PUT /user/:id/reset-password': async (req, res) => {
    const { id } = req.params

    const randomPwd = config.randomPwd ? utils.randomPwd() : undefined
    const password = utils.md5(randomPwd || utils.decrypt(config.defaultPwd))

    // 重置密码后账户状态变为未激活，需要用户重新登录激活
    await AuthService.updateById(id, { password, status: USER_STATUS.INACTIVE })

    AuthService.insertBehavior(req.userContext.id, '管理用户状态', `重置用户密码:${id}`, req.ip)

    res.result = config.randomPwd ? { id, randomPwd } : { id }
  },

  /**
   * users
   */

  'GET /user/:id/behavior': async (req, res) => {
    const { id } = req.params
    const result = await UserService.selectBehavior(id)
    res.result = result
  },

  'GET /users': async (req, res) => {
    const { query } = req.query
    const result = await UserService.selectWithRolesAndGroups({ query })

    result.forEach((user) => {
      user.roles = user.roles?.split(',') || []
      user.groups = user.groups?.split(',') || []
    })
    res.result = result.filter((user) => !BUILDIN_USERS.includes(user.username))
  },
  'GET /users/list': async (req, res) => {
    const result = await UserService.selectList()
    res.result = result.filter((user) => !BUILDIN_USERS.includes(user.username))
  },

  'GET /user/:id': async (req, res) => {
    const { id } = req.params
    const result = await UserService.selectWithRolesAndGroups({ id })

    result.roles = result.roles?.split(',') || []
    result.groups = result.groups?.split(',') || []
    res.result = result
  },

  /**
   * roles
   */

  'GET /roles': async (req, res) => {
    const { query } = req.query
    const result = await RoleService.selectWithUsers({ query })

    result.forEach((role) => {
      role.users = role.users?.split(',') || []
    })
    res.result = result
  },
  'GET /roles/list': async (req, res) => {
    const result = await RoleService.selectList()
    res.result = result
  },

  'GET /role/:id': async (req, res) => {
    const { id } = req.params
    const result = await RoleService.selectWithUsers({ id })

    result.users = result.users?.split(',') || []
    res.result = result
  },

  /**
   * groups
   */

  'GET /groups': async (req, res) => {
    const { query } = req.query
    const result = await GroupService.selectWithUsersAndApplications({ query })

    result.forEach((group) => {
      group.users = group.users?.split(',').filter((username) => !BUILDIN_USERS.includes(username)) || []
      group.applications = group.applications?.split(',') || []
    })
    res.result = result
  },
  'GET /groups/list': async (req, res) => {
    const result = await GroupService.selectList()
    res.result = result
  },

  'GET /group/:id': async (req, res) => {
    const { id } = req.params
    const result = await GroupService.selectWithUsersAndApplications({ id })

    result.users = result.users?.split(',').filter((username) => !BUILDIN_USERS.includes(username)) || []
    result.applications = result.applications?.split(',') || []
    res.result = result
  },

  /**
   * applications
   */

  'GET /applications': async (req, res) => {
    const { query } = req.query
    const result = await ApplicationService.selectWithGroups({ query })

    result.forEach((application) => {
      application.groups = application.groups?.split(',') || []
    })
    res.result = result
  },
  'GET /applications/list': async (req, res) => {
    const result = await ApplicationService.selectList()
    res.result = result
  },

  'GET /application/:id': async (req, res) => {
    const { id } = req.params
    const result = await ApplicationService.selectWithGroups({ id })

    result.groups = result.groups?.split(',') || []
    res.result = result
  },
}
