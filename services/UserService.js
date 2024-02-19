/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-12 11:48:29
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:48
 * @FilePath: /node-cas/services/UserService.js
 * @Description: file content
 */

import { USER_STATUS } from '#constants'
import BaseDAO from '#libs/baseDAO.js'
import connection from '#libs/mysql.js'

class UserService extends BaseDAO {
  constructor(table) {
    super(table)
  }

  async selectBaseById(id) {
    const { table } = this
    const [rows] = await connection.query(`SELECT id,username,nickname,email,phone FROM ${table} WHERE id = ?`, [id])

    return rows[0]
  }

  async selectBaseByUsername(username) {
    const { table } = this
    const [rows] = await connection.execute(
      `SELECT id,username,nickname,email,phone FROM ${table} WHERE username = '${username}'`,
    )
    return rows[0]
  }

  async selectWithRolesAndGroups({ id, query }) {
    if (id) {
      const [rows] = await connection.execute(`
        SELECT *,
          (SELECT GROUP_CONCAT(role_id) FROM t_user_role WHERE user_id = ${id}) AS roles,
          (SELECT GROUP_CONCAT(group_id) FROM t_user_group WHERE user_id = ${id}) AS 'groups'
        FROM v_user where id = ${id}
      `)

      return rows[0]
    }

    let sql = `SELECT *,
      (SELECT GROUP_CONCAT(role_id) FROM t_user_role WHERE user_id = v_user.id) AS roles,
      (SELECT GROUP_CONCAT(group_id) FROM t_user_group WHERE user_id = v_user.id) AS 'groups'
    FROM v_user`

    if (query) {
      sql += ` WHERE username LIKE '%${query}%' OR nickname LIKE '%${query}%'`
    }
    const [rows] = await connection.execute(sql)
    return rows
  }

  async selectList() {
    const { table } = this

    const [rows] = await connection.execute(`SELECT id,username,nickname FROM ${table}`)
    return rows
  }

  async selectByUsername(username) {
    const { table } = this
    const [rows] = await connection.execute(`SELECT * FROM ${table} WHERE username = '${username}'`)
    return rows[0]
  }

  async selectUserGroupIds(userId) {
    const [rows] = await connection.execute(`SELECT group_id FROM t_user_group WHERE user_id = ${userId}`)
    return rows.map((item) => item.group_id)
  }

  async selectUserRoleIds(userId) {
    const [rows] = await connection.execute(`SELECT role_id FROM t_user_role WHERE user_id = ${userId}`)
    return rows.map((item) => item.role_id)
  }

  /**
   * 插入 user-group ，只能在创建用户时调用，否则可能造成重复插入
   */
  async insertUserGroups(userId, groupIds) {
    if (groupIds.length === 0) {
      return []
    }

    await connection.query(`INSERT INTO t_user_group (user_id,group_id) VALUES ?`, [
      groupIds.map((groupId) => [userId, groupId]),
    ])
    return groupIds
  }

  /**
   * 插入 user-role ，只能在创建用户时调用，否则可能造成重复插入
   */
  async insertUserRoles(userId, roleIds) {
    if (roleIds.length === 0) {
      return []
    }

    await connection.query(`INSERT INTO t_user_role (user_id,role_id) VALUES ?`, [
      roleIds.map((roleId) => [userId, roleId]),
    ])
    return roleIds
  }

  /**
   * 更新 user-group
   */
  async updateUserGroups(userId, groupIds) {
    if (groupIds.length === 0) {
      await connection.execute(`DELETE FROM t_user_group WHERE user_id = ${userId}`)
      return []
    }

    const conn = await connection.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query(`DELETE FROM t_user_group WHERE user_id = ? AND group_id NOT IN (?)`, [userId, groupIds])
      const [exists] = await conn.query(`SELECT group_id FROM t_user_group WHERE user_id = ? AND group_id IN (?)`, [
        userId,
        groupIds,
      ])
      const existIds = exists.map((item) => item.group_id)
      const notExistsIds = groupIds.filter((groupId) => !existIds.includes(groupId))

      if (notExistsIds.length) {
        await conn.query(`INSERT INTO t_user_group (user_id,group_id) VALUES ?`, [
          notExistsIds.map((groupId) => [userId, groupId]),
        ])
      }
      await conn.commit()
      return groupIds
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  /**
   * 更新 user-role
   */
  async updateUserRoles(userId, roleIds) {
    if (roleIds.length === 0) {
      await connection.query(`DELETE FROM t_user_role WHERE user_id = ?`, [userId])
      return []
    }

    const conn = await connection.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query(`DELETE FROM t_user_role WHERE user_id = ? AND role_id NOT IN (?)`, [userId, roleIds])

      const [exists] = await conn.query(`SELECT role_id FROM t_user_role WHERE user_id = ? AND role_id IN (?)`, [
        userId,
        roleIds,
      ])
      const existsIds = exists.map((item) => item.role_id)
      const notExistsIds = roleIds.filter((roleId) => !existsIds.includes(roleId))

      if (notExistsIds.length) {
        await conn.query(`INSERT INTO t_user_role (user_id,role_id) VALUES ?`, [
          notExistsIds.map((roleId) => [userId, roleId]),
        ])
      }
      await conn.commit()
      return roleIds
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async selectBehavior(userId) {
    const [rows] = await connection.query(`SELECT * FROM t_user_behavior WHERE user_id = ? ORDER BY create_at DESC`, [
      userId,
    ])
    return rows
  }

  async deleteWithRolesAndGroups(userId) {
    const conn = await connection.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query(`DELETE FROM t_user_group WHERE user_id = ?`, [userId])
      await conn.query(`DELETE FROM t_user_role WHERE user_id = ?`, [userId])
      await conn.query(`DELETE FROM t_user WHERE id = ?`, [userId])
      await conn.commit()
      return userId
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async updateUserStatus(id, status) {
    const statuses = Object.values(USER_STATUS)
    if (statuses.indexOf(status) === -1) {
      throw new Error('Invalid status')
    }

    const [rows] = await connection.execute(`UPDATE t_user set status='${status}' WHERE id = ${id}`)

    return rows
  }
}

export default new UserService('v_user')
