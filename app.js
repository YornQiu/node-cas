import App, { Body, Cors, Static, Send } from 'veloc'

import adminRoutes from '#routers/admin.js'
import auditRoutes from '#routers/audit.js'
import authRoutes from '#routers/auth.js'
import corsHandler from '#middlewares/cors.js'
import { loggerMiddleware } from '#middlewares/logger.js'
import { responseHandler, errorHandler } from '#middlewares/response.js'
// import proxy from '#routers/proxy.js'

const app = new App({
  proxy: true,
  onerror: errorHandler,
})

// Logger
app.use(loggerMiddleware)

// Error Handler
// app.use(errorHandler)

app.use(
  Body({
    multipart: true,
    formidable: {
      keepExtensions: true,
      maxFieldsSize: 1024 * 1024 * 1024, // 1GB
    },
  }),
)

app.use(Send())

// Static
app.use(Static(config.publicDir))

// Cors
app.use(Cors(corsHandler))

// Routes
app.use(adminRoutes.routes())
app.use(auditRoutes.routes())
app.use(authRoutes.routes())

// Proxy
// app.use(proxy)

// Response
app.use(responseHandler)

export default app
