/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-11 17:09:36
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:28:12
 * @FilePath: /node-cas/ecosystem.config.js
 * @Description: pm2 configuration
 */

const { name } = require('./config')

module.exports = {
  apps: [
    {
      name: name,
      script: './bin/www', //执行脚本
      args: '', //传递给脚本的参数
      instances: 1, //实例个数
      autorestart: true,
      watch: true,
      ignore_watch: [
        // 不用监听的文件
        'node_modules',
        'logs',
      ],
      error_file: './logs/error.log', // 错误日志文件
      out_file: './logs/access.log', // 正常日志文件
      log_date_format: 'YYYY-MM-DD HH:mm:ss', // 日志时间格式
      max_memory_restart: '4G', // 最大内存限制
      env_dev: {
        NODE_ENV: 'development',
        REMOTE_ADDR: '',
      },
      env_prod: {
        NODE_ENV: 'production',
        REMOTE_ADDR: '',
      },
      env_test: {
        NODE_ENV: 'test',
        REMOTE_ADDR: '',
      },
    },
  ],
}
