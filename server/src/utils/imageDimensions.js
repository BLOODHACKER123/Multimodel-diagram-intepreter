import { imageSize } from 'image-size'

export function getImageDimensions(buffer) {
  try {
    const result = imageSize(buffer)
    if (result?.width && result?.height) {
      return { width: result.width, height: result.height }
    }
  } catch (err) {
    console.warn('[imageDimensions] could not read dimensions:', err.message)
  }
  return undefined
}
