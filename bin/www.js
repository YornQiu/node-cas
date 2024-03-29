#!/usr/bin/env node
import './preload.js'

import { createServer } from 'http'
import app from '#root/app.js'

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val)

  if (isNaN(port)) return val

  if (port >= 0) return port

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges')
      process.exit(1)
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use')
      process.exit(1)
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address()
  const bind = typeof addr === 'string' ? `pipe ${addr} ` : `port ${addr.port}`
  logger.info(`Listening on ${bind} ...`)
}

const port = normalizePort(process.env.PORT || config.port)
const server = app.listen(port)

server.on('error', onError)
server.on('listening', onListening)
