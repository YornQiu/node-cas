/*
 * @Author: Yorn Qiu
 * @Date: 2024-01-09 15:13:25
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:29:40
 * @FilePath: /node-cas/bin/preload.js
 * @Description:
 */

import config from '#root/config/index.js'
import { logger } from '#middlewares/logger.js'

global.config = config
global.logger = logger
