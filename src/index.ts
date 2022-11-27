import { compileFileToJs } from './gen'

const fileRegex = /\.(blayout)$/

export function blayout() {
  return {
    name: 'transform-file',
    transform(src: string, id: string) {

      if (fileRegex.test(id)) {
        return {
          code: compileFileToJs(src),
          map: null
        }
      }
      return undefined
    }
  }
}
