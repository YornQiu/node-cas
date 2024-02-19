/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-12 10:25:17
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:17
 * @FilePath: /node-cas/libs/baseDAO.js
 * @Description: DAO
 */

import connection from '#libs/mysql.js'

class DAO {
  constructor(table) {
    this.table = table
  }

  /**
   * 插入数据
   * @param {object|array} data 单条数据或多条数据
   * @returns
   */
  async insert(data) {
    const { table } = this

    // 批量插入
    if (Array.isArray(data)) {
      const fields = Object.keys(data[0])
      const fieldsStr = fields.join(',')
      const values = data.map((item) => fields.map((field) => item[field]))

      const [rows] = await connection.query(`INSERT INTO ${table} (${fieldsStr}) VALUES ?`, [values])

      return rows.affectedRows
    }

    const fields = Object.keys(data)
    const fieldsStr = fields.join(',')
    const values = [Object.values(data)]

    const [rows] = await connection.query(`INSERT INTO ${table} (${fieldsStr}) VALUES ?`, [values])

    return rows.insertId
  }

  async selectOne(condition) {
    const { table } = this
    const conditionStr = transformCondition(condition)

    const [rows] = await connection.execute(`SELECT * FROM ${table} WHERE ${conditionStr}`)

    return rows[0]
  }

  async select(condition) {
    const { table } = this
    const conditionStr = transformCondition(condition)

    const [rows] = condition
      ? await connection.execute(`SELECT * FROM ${table} WHERE ${conditionStr}`)
      : await connection.execute(`SELECT * FROM ${table}`)

    return rows
  }

  async selectByPage(page, pageSize, condition) {
    const { table } = this
    const conditionStr = transformCondition(condition)

    if (page == undefined || pageSize == undefined) {
      return await this.select(condition)
    }

    const [rows] = await connection.execute(
      `SELECT * FROM ${table} WHERE ${conditionStr} LIMIT ${(page - 1) * pageSize}, ${pageSize}`,
    )

    return rows
  }

  async update(condition, data) {
    const { table } = this
    const entity = filterUndefined(data)
    const keyStr = Object.keys(entity)
      .map((k) => k + '=?')
      .join(',')

    const conditionStr = transformCondition(condition)

    const [rows] = await connection.query(`UPDATE ${table} SET ${keyStr} WHERE ${conditionStr}`, Object.values(entity))

    return rows
  }

  async delete(condition) {
    const { table } = this
    const conditionStr = transformCondition(condition)

    const [rows] = await connection.execute(`DELETE FROM ${table} WHERE ${conditionStr}`)

    return rows
  }

  async selectById(id) {
    const { table } = this
    const [rows] = await connection.query(`SELECT * FROM ${table} WHERE id = ?`, [id])

    return rows[0]
  }

  async updateById(id, data) {
    const { table } = this
    const entity = filterUndefined(data)
    const keyStr = Object.keys(entity)
      .map((k) => k + '=?')
      .join(',')

    const [rows] = await connection.query(`UPDATE ${table} SET ${keyStr} WHERE id = ?`, [...Object.values(entity), id])

    return rows
  }

  async deleteById(id) {
    const { table } = this
    const [rows] = await connection.query(`DELETE FROM ${table} WHERE id = ?`, [id])

    return rows
  }
}

/**
 * remove undefined field of object
 * @param {object} data
 * @returns {object} data
 */
function filterUndefined(data) {
  const entity = {}
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) entity[key] = value
  })

  return entity
}

/**
 * transform condition into sql string
 * @param {object|array} condition
 * @returns {string}
 */
function transformCondition(condition) {
  if (!condition) return ''

  if (Array.isArray(condition)) {
    return condition.map((item) => `${item.field} ${item.operator} ${item.value}`).join(' AND ')
  } else {
    return Object.entries(condition)
      .map((entry) => entry[0] + '=' + (typeof entry[1] === 'string' ? `'${entry[1]}'` : entry[1]))
      .join(' AND ')
  }
}

export default DAO
