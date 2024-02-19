import devConfig from './config.dev.js'
import prodConfig from './config.prod.js'

export default process.env.NODE_ENV === 'production' ? prodConfig : devConfig
