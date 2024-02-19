/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-12 11:48:29
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:35
 * @FilePath: /node-cas/services/ApplicationService.js
 * @Description: file content
 */

import BaseDAO from '#libs/baseDAO.js'
import connection from '#libs/mysql.js'

class ApplicationService extends BaseDAO {
  constructor(table) {
    super(table)
  }

  async selectWithGroups({ id, query }) {
    if (id) {
      const [rows] = await connection.execute(`
        SELECT *,
          (SELECT GROUP_CONCAT(group_id) FROM t_application_group WHERE application_id = '${id}') AS 'groups'
        FROM t_application where id = '${id}'
      `)
      return rows[0]
    }

    let sql = `SELECT *,
      (SELECT GROUP_CONCAT(group_id) FROM t_application_group WHERE application_id = t_application.id) AS 'groups'
    FROM t_application`

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

  async selectByGroupIds(groupIds) {
    if (groupIds.length === 0) {
      return []
    }

    const [applications] = await connection.query(
      `SELECT DISTINCT application_id FROM t_application_group WHERE group_id IN (?)`,
      [groupIds],
    )
    if (!applications.length) {
      return []
    }

    const [rows] = await connection.query(`SELECT * FROM t_application WHERE id IN (?)`, [
      applications.map((e) => e.application_id),
    ])

    return rows
  }

  /**
   * 插入 application-group ，只能在创建应用时调用，否则可能造成重复插入
   */
  async insertApplicationGroups(applicationId, groupIds) {
    if (groupIds.length === 0) {
      return []
    }

    await connection.query(`INSERT INTO t_application_group (application_id, group_id) VALUES ?`, [
      groupIds.map((groupId) => [applicationId, groupId]),
    ])
    return groupIds
  }

  /**
   * 更新 application-group
   */
  async updateApplicationGroups(applicationId, groupIds) {
    if (groupIds.length === 0) {
      await connection.execute(`DELETE FROM t_application_group WHERE application_id = '${applicationId}'`)
      return []
    }

    const conn = await connection.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query(`DELETE FROM t_application_group WHERE application_id = ? AND group_id NOT IN (?)`, [
        applicationId,
        groupIds,
      ])
      const [exists] = await conn.query(
        `SELECT group_id FROM t_application_group WHERE application_id = ? AND group_id IN (?)`,
        [applicationId, groupIds],
      )
      const existsIds = exists.map((row) => row.group_id)
      const notExistsIds = groupIds.filter((groupId) => !existsIds.includes(groupId))

      if (notExistsIds.length) {
        await conn.query(`INSERT INTO t_application_group (application_id, group_id) VALUES ?`, [
          notExistsIds.map((groupId) => [applicationId, groupId]),
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

  async deleteWithGroups(id) {
    const conn = await connection.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query(`DELETE FROM t_application_group WHERE application_id = ?`, [id])
      await conn.query(`DELETE FROM t_application WHERE id = ?`, [id])
      await conn.commit()
      return id
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }
}

export default new ApplicationService('t_application')
