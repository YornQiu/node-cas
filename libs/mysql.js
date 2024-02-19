/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-11 17:53:10
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:28
 * @FilePath: /node-cas/libs/mysql.js
 * @Description: mysql connection
 */

import mysql from 'mysql2'

const { host, port, user, pwd, db } = config.mysql

const pool = mysql.createPool({
  host,
  port,
  user,
  password: pwd,
  database: db,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 60000,
  connectionLimit: 10,
  maxIdle: 10,
  queueLimit: 0,
})

logger.info('Mysql: Connection pool created')

pool.on('connection', () => {
  logger.info('Mysql: New connection')
})

/**
 * Hack!!!
 * Connection may close at times, and it occurs randomly.
 * We need to keep the connection alive.
 */
// setInterval(() => {
//   pool.query('SELECT 1')
// }, 60000)

export default pool.promise()
