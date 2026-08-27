import multer from 'multer'
import { config } from '../config.js'

const MAX_SIZE = config.maxUploadMb * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SIZE,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`BAD_MIME: expected image/png, image/jpeg, or image/webp, got ${file.mimetype}`))
    }
  },
})

export const uploadSingleImage = upload.single('image')
