/*
 * @Author: Yorn Qiu
 * @Date: 2022-01-24 09:45:47
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:32
 * @FilePath: /node-cas/libs/redis.js
 * @Description: redis connection
 */

import { createClient } from 'redis'

const { port, host, db } = config.redis

const url = `redis://${host}:${port}/${db}`
const client = createClient({ url })

client.connect()

client.on('ready', async () => {
  logger.info('Redis: ready')
})

client.on('end', () => {
  logger.info('Redis: closed')
})

client.on('error', (err) => {
  logger.error(err)
})

client.on('connect', () => {
  logger.info('Redis: connected')
})

export default client
