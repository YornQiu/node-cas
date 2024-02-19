/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-11 17:11:42
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-30 16:37:15
 * @FilePath: /node-cas/controllers/AdminController.js
 * @Description: admin api
 */

import { InvalidQueryError } from '#libs/error.js'
import { UserService, AuthService, RoleService, GroupService, ApplicationService } from '#services'
import { BUILDIN_GROUPS, BUILDIN_USERS, USER_GROUPS } from '#constants'
import utils from '#utils'

/**
 * 新增、更改、删除操作需要admin权限
 */
export default {
  /**
   * users
   */

  'POST /user': async (req, res) => {
    const { username, nickname, email, phone, roles = [], groups = [] } = req.body
    if (!username) throw new InvalidQueryError()

    if (await AuthService.selectOne({ username })) {
      res.error = '用户名已存在'
      return
    }

    if (email && (await AuthService.selectOne({ email }))) {
      res.error = '邮箱已被使用'
      return
    }

    const randomPwd = config.randomPwd ? utils.randomPwd() : undefined
    const password = utils.md5(randomPwd || utils.decrypt(config.defaultPwd))
    const userId = await AuthService.insert({ username, nickname: nickname || username, password, email, phone })
    if (roles.length) {
      await UserService.insertUserRoles(userId, roles)
    }
    if (groups.length) {
      await UserService.insertUserGroups(userId, groups)
    }

    AuthService.insertBehavior(req.userContext.id, '管理用户', `创建用户:${userId}`, req.ip)

    const user = await UserService.selectById(userId)
    res.result = config.randomPwd ? { ...user, roles, groups, randomPwd } : { ...user, roles, groups }
  },

  'PUT /user/:id': async (req, res) => {
    const { id } = req.params
    const { nickname, status, email, phone, roles, groups } = req.body
    await UserService.updateById(id, { nickname, status, email, phone })

    if (roles) {
      await UserService.updateUserRoles(id, roles)
    }
    if (groups) {
      await UserService.updateUserGroups(id, groups)
    }

    AuthService.insertBehavior(req.userContext.id, '管理用户', `修改用户信息:${id}`, req.ip)

    const user = await UserService.selectById(id)
    res.result = { ...user, roles, groups }
  },
  'DELETE /user/:id': async (req, res) => {
    const { id } = req.params
    const user = await UserService.selectById(id)

    if (BUILDIN_USERS.includes(user.username)) {
      res.error = '系统内置用户，无法删除'
    } else {
      // 删除用户时，同时删除用户关联的角色和用户组
      await UserService.deleteWithRolesAndGroups(id)

      AuthService.insertBehavior(req.userContext.id, '管理用户', `删除用户:${id}`, req.ip)
      res.result = id
    }
  },

  /**
   * roles
   */

  'POST /role': async (req, res) => {
    const { body } = req.request
    if (!body.id) throw new InvalidQueryError()

    const { id, name, description, users = [] } = body
    await RoleService.insert({ id, name, description })

    if (users.length) {
      await RoleService.insertRoleUsers(id, users)
    }

    AuthService.insertBehavior(req.userContext.id, '管理权限', `创建用户角色:${id}`, req.ip)

    const role = await RoleService.selectById(id)
    res.result = { ...role, users }
  },
  'PUT /role/:id': async (req, res) => {
    const { id } = req.params
    const { name, description, users } = req.body
    await RoleService.updateById(id, { name, description })

    if (users) {
      await RoleService.updateRoleUsers(id, users)
    }

    AuthService.insertBehavior(req.userContext.id, '管理权限', `修改用户角色:${id}`, req.ip)

    const role = await RoleService.selectById(id)
    res.result = { ...role, users }
  },
  'DELETE /role/:id': async (req, res) => {
    const { id } = req.params

    const result = await RoleService.selectWithUsers({ id })

    if (result.users) {
      res.error = '存在关联用户，无法删除'
    } else {
      await RoleService.deleteById(id)

      AuthService.insertBehavior(req.userContext.id, '管理权限', `删除用户角色:${id}`, req.ip)
      res.result = id
    }
  },

  /**
   * groups
   */

  'POST /group': async (req, res) => {
    const { body } = req
    if (!body.id) throw new InvalidQueryError()

    const { id, name, description, users = [], applications = [] } = body
    await GroupService.insert({ id, name, description })
    const groupId = id

    if (applications.length) {
      await GroupService.insertGroupApplications(groupId, applications)
    }

    let insertedUsers = users // users为用户名数组
    if (users.length) {
      // 系统内置用户组不能与其他用户组共存，新建用户组均为非内置用户组，从用户中过滤掉内置用户组的用户
      const buildins = await GroupService.selectBuildinGroupUsers(users)
      const nonBuildins = buildins.length ? users.filter((user) => !buildins.includes(user)) : users

      await GroupService.insertGroupUsers(groupId, nonBuildins)
      insertedUsers = nonBuildins
    }

    AuthService.insertBehavior(req.userContext.id, '管理权限', `创建用户组:${id}`, req.ip)

    const group = await GroupService.selectById(groupId)
    if (insertedUsers.length !== users.length) {
      res.result = {
        data: { ...group, applications, users: insertedUsers },
        message: '创建成功。但部分用户已关联系统内置用户组，无法关联此用户组',
        status: false,
      }
    } else {
      res.result = {
        data: { ...group, applications, users: insertedUsers },
        message: '创建成功',
        status: true,
      }
    }
  },
  'PUT /group/:id': async (req, res) => {
    const { id } = req.params
    const { name, description, users, applications } = req.body
    await GroupService.updateById(id, { name, description })
    const groupId = id

    if (applications) {
      await GroupService.updateGroupApplications(id, applications)
    }

    // 系统内置用户组不能与其他用户组共存
    let insertedUsers = users
    if (BUILDIN_GROUPS.includes(id)) {
      // 如果是系统用户组，则排除其他用户组的用户
      // 保留admin和audit
      const reservedBuildinUser = id === USER_GROUPS.ADMIN ? USER_GROUPS.ADMIN : USER_GROUPS.AUDIT
      if (users?.length === 0) {
        await GroupService.updateGroupUsers(groupId, [reservedBuildinUser])
      } else {
        const nonBuildins = await GroupService.selectNonBuildinGroupUsers(users)
        const buildins = nonBuildins.length ? users.filter((user) => !nonBuildins.includes(user)) : users

        await GroupService.updateGroupUsers(groupId, [...buildins, reservedBuildinUser])
        insertedUsers = buildins
      }
    } else {
      // 否则，排除系统内置用户组的用户
      if (users?.length === 0) {
        await GroupService.updateGroupUsers(groupId, users)
      } else {
        const buildins = await GroupService.selectBuildinGroupUsers(users)
        const nonBuildins = buildins.length ? users.filter((user) => !buildins.includes(user)) : users

        await GroupService.updateGroupUsers(groupId, nonBuildins)
        insertedUsers = nonBuildins
      }
    }

    AuthService.insertBehavior(req.userContext.id, '管理权限', `修改用户组:${id}`, req.ip)

    const group = await GroupService.selectById(id)
    if (insertedUsers.length !== users.length) {
      res.result = {
        data: { ...group, applications, users: insertedUsers },
        message: '修改成功。因系统内置用户组无法与其他用户组共存，部分用户用户组未修改',
        status: false,
      }
    } else {
      res.result = {
        data: { ...group, applications, users: insertedUsers },
        message: '修改成功',
        status: true,
      }
    }
  },
  'DELETE /group/:id': async (req, res) => {
    const { id } = req.params

    if (BUILDIN_GROUPS.includes(id)) {
      res.error = '系统内置用户组，无法删除'
      return
    }

    const result = await GroupService.selectWithUsersAndApplications({ id })

    if (result.users || result.applications) {
      res.error = '存在关联用户或应用，无法删除'
    } else {
      await GroupService.deleteById(id)

      AuthService.insertBehavior(req.userContext.id, '管理权限', `删除用户组:${id}`, req.ip)
      res.result = id
    }
  },

  /**
   * applications
   */

  'POST /application': async (req, res) => {
    const { body } = req
    if (!body.id) throw new InvalidQueryError()

    const { id, name, route, entry, icon, description, groups = [] } = body
    await ApplicationService.insert({ id, name, route, entry, icon, description })

    if (groups.length) {
      await ApplicationService.insertApplicationGroups(id, groups)
    }

    AuthService.insertBehavior(req.userContext.id, '管理应用', `创建应用:${id}`, req.ip)

    const application = await ApplicationService.selectById(id)
    res.result = { ...application, groups }
  },
  'PUT /application/:id': async (req, res) => {
    const { id } = req.params
    const { name, route, entry, icon, description, groups } = req.body
    await ApplicationService.updateById(id, { name, route, entry, icon, description })

    if (groups) {
      await ApplicationService.updateApplicationGroups(id, groups)
    }

    AuthService.insertBehavior(req.userContext.id, '管理应用', `修改应用信息:${id}`, req.ip)

    const application = await ApplicationService.selectById(id)
    res.result = { ...application, groups }
  },
  'DELETE /application/:id': async (req, res) => {
    const { id } = req.params
    // 删除应用时，同时删除应用关联的用户组
    await ApplicationService.deleteWithGroups(id)

    AuthService.insertBehavior(req.userContext.id, '管理应用', `删除应用:${id}`, req.ip)
    res.result = id
  },
}
