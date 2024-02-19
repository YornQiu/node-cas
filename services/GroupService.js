/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-12 11:48:29
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:40
 * @FilePath: /node-cas/services/GroupService.js
 * @Description: file content
 */

import { BUILDIN_GROUPS } from '#constants'
import BaseDAO from '#libs/baseDAO.js'
import connection from '#libs/mysql.js'

class GroupService extends BaseDAO {
  constructor(table) {
    super(table)
  }

  async selectList() {
    const { table } = this

    const [rows] = await connection.execute(`SELECT id,name FROM ${table}`)
    return rows
  }

  async selectWithUsersAndApplications({ id, query }) {
    if (id) {
      const [rows] = await connection.execute(`
        SELECT *,
          (SELECT GROUP_CONCAT(username) FROM t_user_group LEFT JOIN t_user 
            ON user_id = t_user.id WHERE group_id = '${id}') AS users,
          (SELECT GROUP_CONCAT(application_id) FROM t_application_group WHERE group_id = '${id}') AS applications
        FROM t_group where id = '${id}'
      `)
      return rows[0]
    }

    let sql = `SELECT *,
      (SELECT GROUP_CONCAT(username) FROM t_user_group LEFT JOIN t_user 
        ON user_id = t_user.id WHERE group_id = t_group.id) AS users,
      (SELECT GROUP_CONCAT(application_id) FROM t_application_group WHERE group_id = t_group.id) AS applications
    FROM t_group`

    if (query) {
      sql += ` WHERE id LIKE '%${query}%' OR name LIKE '%${query}%'`
    }
    const [rows] = await connection.execute(sql)
    return rows
  }

  /**
   * 获取系统内置用户组用户
   */
  async selectBuildinGroupUsers(usernames) {
    let sql = `SELECT username FROM t_user_group LEFT JOIN t_user ON user_id = t_user.id WHERE group_id IN (?)`
    if (usernames?.length) sql += ` AND username IN (?)`

    const [rows] = await connection.query(sql, [BUILDIN_GROUPS, usernames])

    return rows.map((row) => row.username)
  }

  /**
   * 获取非系统内置用户组用户
   */
  async selectNonBuildinGroupUsers(usernames) {
    let sql = `SELECT username FROM t_user_group LEFT JOIN t_user ON user_id = t_user.id WHERE group_id NOT IN (?)`
    if (usernames?.length) sql += ` AND username IN (?)`

    const [rows] = await connection.query(sql, [BUILDIN_GROUPS, usernames])

    return rows.map((row) => row.username)
  }

  /**
   * 插入 user-group ，只能在创建用户组时调用，否则可能造成重复插入
   */
  async insertGroupUsers(groupId, usernames) {
    if (usernames.length === 0) {
      return []
    }

    const [users] = await connection.query(`SELECT id FROM t_user WHERE username IN (?)`, [usernames])
    const userIds = users.map((row) => row.id)

    await connection.query(`INSERT INTO t_user_group (user_id, group_id) VALUES ?`, [
      userIds.map((userId) => [userId, groupId]),
    ])
    return usernames
  }

  /**
   * 插入 application-group ，只能在创建用户组时调用，否则可能造成重复插入
   */
  async insertGroupApplications(groupId, applicationIds) {
    if (applicationIds.length === 0) {
      return []
    }

    await connection.query(`INSERT INTO t_application_group (application_id, group_id) VALUES ?`, [
      applicationIds.map((applicationId) => [applicationId, groupId]),
    ])
    return applicationIds
  }

  /**
   * 更新 user-group
   */
  async updateGroupUsers(groupId, usernames) {
    if (usernames.length === 0) {
      await connection.execute(`DELETE FROM t_user_group WHERE group_id = '${groupId}'`)
      return []
    }

    const conn = await connection.getConnection()
    try {
      await conn.beginTransaction()
      const [users] = await conn.query(`SELECT id FROM t_user WHERE username IN (?)`, [usernames])
      const userIds = users.map((row) => row.id)

      await conn.query(`DELETE FROM t_user_group WHERE group_id = ? AND user_id NOT IN (?)`, [groupId, userIds])
      const [exists] = await conn.query(`SELECT user_id FROM t_user_group WHERE group_id = ? AND user_id IN (?)`, [
        groupId,
        userIds,
      ])
      const existIds = exists.map((row) => row.user_id)
      const notExistsIds = userIds.filter((userId) => !existIds.includes(userId))

      if (notExistsIds.length) {
        await conn.query(`INSERT INTO t_user_group (user_id, group_id) VALUES ?`, [
          notExistsIds.map((userId) => [userId, groupId]),
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

  /**
   * 更新 application-group
   */
  async updateGroupApplications(groupId, applicationIds) {
    if (applicationIds.length === 0) {
      await connection.execute(`DELETE FROM t_application_group WHERE group_id = '${groupId}'`)
      return []
    }

    const conn = await connection.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query(`DELETE FROM t_application_group WHERE group_id = ? AND application_id NOT IN (?)`, [
        groupId,
        applicationIds,
      ])
      const [exists] = await conn.query(
        `SELECT application_id FROM t_application_group WHERE group_id = ? AND application_id IN (?)`,
        [groupId, applicationIds],
      )
      const existIds = exists.map((row) => row.application_id)
      const notExistsIds = applicationIds.filter((applicationId) => !existIds.includes(applicationId))

      if (notExistsIds.length) {
        await conn.query(`INSERT INTO t_application_group (application_id, group_id) VALUES ?`, [
          notExistsIds.map((applicationId) => [applicationId, groupId]),
        ])
      }
      await conn.commit()
      return applicationIds
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }
}

export default new GroupService('t_group')
