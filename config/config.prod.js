/*
 * @Author: Yorn Qiu
 * @Date: 2022-08-04 16:47:14
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:30:07
 * @FilePath: /node-cas/config/config.prod.js
 * @Description: production config
 */

import config from './config.js'

export default {
  ...config,
  port: 80,
  forceChangePwd: true,
  redis: {
    host: 'redis-master.trade-system.svc.cluster.local',
    port: 6379,
    db: 5,
  },
  mysql: {
    host: '172.17.100.23',
    port: 3306,
    user: 'root',
    pwd: '11111111',
    db: 'node_cas',
  },
}
