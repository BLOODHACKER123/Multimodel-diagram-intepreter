import { isDevelopment } from '../config.js'

export function errorHandler(err, _req, res, _next) {
  let code = 'INTERNAL'
  let message = 'Something went wrong.'

  if (err.message) {
    if (err.message.startsWith('BAD_MIME')) {
      code = 'BAD_MIME'
      message = err.message.replace('BAD_MIME: ', '')
    } else if (err.message.startsWith('NO_FILE')) {
      code = 'NO_FILE'
      message = err.message.replace('NO_FILE: ', '')
    } else if (err.message.startsWith('FILE_TOO_LARGE')) {
      code = 'FILE_TOO_LARGE'
      message = err.message.replace('FILE_TOO_LARGE: ', '')
    } else if (err.message.startsWith('VALIDATION_FAILED')) {
      code = 'VALIDATION_FAILED'
      message = err.message.replace('VALIDATION_FAILED: ', '')
    } else if (err.message.startsWith('PROVIDER_')) {
      code = err.message.split(':')[0]
      message = err.message.replace(`${code}: `, '')
    }
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    code = 'FILE_TOO_LARGE'
    message = `File too large. Maximum size is ${res.req.app.locals.config?.maxUploadMb || 10} MB.`
  }

  const status = {
    NO_FILE: 400,
    BAD_MIME: 400,
    FILE_TOO_LARGE: 413,
    VALIDATION_FAILED: 400,
    PROVIDER_ERROR: 502,
    PROVIDER_BAD_JSON: 502,
    INTERNAL: 500,
  }[code] || 500

  res.status(status).json({
    ok: false,
    error: {
      code,
      message,
      ...(isDevelopment() ? { stack: err.stack } : {}),
    },
  })
}
