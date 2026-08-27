import sharp from 'sharp'

const MAX_DIMENSION = 1280

export async function resizeImage(buffer) {
  try {
    const resized = await sharp(buffer)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer()
    return { buffer: resized, mimeType: 'image/png' }
  } catch (err) {
    console.warn('[resizeImage] could not resize image:', err.message)
    return { buffer, mimeType: undefined }
  }
}
