/*
 * @Author: Yorn Qiu
 * @Date: 2022-04-12 16:31:26
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 16:27:37
 * @FilePath: /node-cas/constants.js
 * @Description: constants
 */

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOCKED: 'locked',
  CANCELLED: 'cancelled',
}

export const USER_GROUPS = {
  ADMIN: 'admin',
  AUDIT: 'audit',
}

export const BUILDIN_USERS = ['admin', 'audit']
export const BUILDIN_GROUPS = ['admin', 'audit']
