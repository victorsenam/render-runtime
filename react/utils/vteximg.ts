const SECURE_PROTOCOL = 'https://'
const PROTOCOL_RELATIVE_PREFIX = '//'
const ARQUIVOS_RELATIVE_PREFIX = '/arquivos'
const ASSETS_RELATIVE_PREFIX = '/assets'
const FILE_MANAGER_PATH_REGEX = /url\(\"?(.*\/)assets\/vtex\.file-manager-graphql/

export function optimizeSrcForVtexImg (vtexImgHost: string, src?: any) {
  try {
    if (src && src.indexOf(PROTOCOL_RELATIVE_PREFIX) === 0) {
      return src.replace(PROTOCOL_RELATIVE_PREFIX, SECURE_PROTOCOL)
    }

    if (src && src.indexOf(ARQUIVOS_RELATIVE_PREFIX) === 0 || src.indexOf(ASSETS_RELATIVE_PREFIX) === 0) {
      return vtexImgHost + src
    }

    return src
  } catch (e) {
    console.warn('Failed to optimize image source.')
    return src
  }
}

export function optimizeStyleForVtexImg (vtexImgHost: string, style?: any) {
  try {
    if (style && style.backgroundImage) {
      const match = FILE_MANAGER_PATH_REGEX.exec(style.backgroundImage)
      if (match && match[1]) {
        style.backgroundImage = style.backgroundImage.replace(match[1], vtexImgHost + '/')
      }
    }

    return style
  } catch (e) {
    console.warn('Failed to optimize style.')
    return style
  }
}
