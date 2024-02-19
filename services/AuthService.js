/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-12 11:48:29
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:38
 * @FilePath: /node-cas/services/AuthService.js
 * @Description: file content
 */

import BaseDAO from '#libs/baseDAO.js'
import connection from '#libs/mysql.js'

/**
 * This class access data from table t_user, UserService access data from v_user
 * The difference is v_user has no password field,
 */
class AuthService extends BaseDAO {
  constructor(table) {
    super(table)
  }

  /**
   * record user behavior
   * @param {number} user_id user id
   * @param {string} type behavior type
   * @param {string} description behavior description
   * @param {string} ip
   * @returns
   */
  async insertBehavior(user_id, type, description, ip) {
    const [rows] = await connection.execute(
      `INSERT INTO t_user_behavior (user_id,type,behavior,ip) values ('${user_id}','${type}','${description}','${ip}')`,
    )

    return rows
  }
}

export default new AuthService('t_user')
