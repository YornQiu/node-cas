/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-12 11:48:29
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:45
 * @FilePath: /node-cas/services/RoleService.js
 * @Description: file content
 */

import BaseDAO from '#libs/baseDAO.js'
import connection from '#libs/mysql.js'

class RoleService extends BaseDAO {
  constructor(table) {
    super(table)
  }

  async selectWithUsers({ id, query }) {
    if (id) {
      const [rows] = await connection.execute(`
        SELECT *,
          (SELECT GROUP_CONCAT(username) FROM t_user_role LEFT JOIN t_user 
            ON t_user.id = t_user_role.user_id WHERE role_id = '${id}') AS users
        FROM t_role where id = '${id}'
      `)
      return rows[0]
    }

    let sql = `SELECT *,
      (SELECT GROUP_CONCAT(username) FROM t_user_role LEFT JOIN t_user 
        ON user_id = t_user.id WHERE role_id = t_role.id) AS users
    FROM t_role`

    if (query) {
      sql += ` WHERE id LIKE '%${query}%' OR name LIKE '%${query}%'`
    }
    const [rows] = await connection.execute(sql)
    return rows
  }

  async selectList() {
    const { table } = this

    const [rows] = await connection.execute(`SELECT id,name FROM ${table}`)
    return rows
  }

  /**
   * 插入 user-role ，只能在创建角色时调用，否则可能造成重复插入
   */
  async insertRoleUsers(roleId, usernames) {
    if (usernames.length === 0) {
      return []
    }

    const [users] = await connection.query(`SELECT id FROM t_user WHERE username IN (?)`, [usernames])
    const userIds = users.map((row) => row.id)

    await connection.query(`INSERT INTO t_user_role (user_id, role_id) VALUES ?`, [
      userIds.map((userId) => [userId, roleId]),
    ])
    return usernames
  }

  /**
   * 更新 user-role
   */
  async updateRoleUsers(roleId, usernames) {
    if (usernames.length === 0) {
      await connection.execute(`DELETE FROM t_user_role WHERE role_id = '${roleId}'`)
      return []
    }

    const conn = await connection.getConnection()
    try {
      await conn.beginTransaction()

      const [users] = await conn.query(`SELECT id FROM t_user WHERE username IN (?)`, [usernames])
      const userIds = users.map((row) => row.id)

      await conn.query(`DELETE FROM t_user_role WHERE role_id = ? AND user_id NOT IN (?)`, [roleId, userIds])
      const [exists] = await conn.query(`SELECT user_id FROM t_user_role WHERE role_id = ? AND user_id IN (?)`, [
        roleId,
        userIds,
      ])
      const existIds = exists.map((row) => row.user_id)
      const notExistsIds = userIds.filter((userId) => !existIds.includes(userId))

      if (notExistsIds.length) {
        await conn.query(`INSERT INTO t_user_role (user_id, role_id) VALUES ?`, [
          notExistsIds.map((userId) => [userId, roleId]),
        ])
      }
      await conn.commit()
      return usernames
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }
}

export default new RoleService('t_role')
