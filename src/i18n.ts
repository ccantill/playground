import {Tree} from "./github";

type I18NFileFormat = "i18next_v1";

export interface I18NConfig {
  resources: {
    filePathPattern: string
    format: I18NFileFormat
  }[]
}

export class I18NResource {
  constructor(readonly filepath: string, readonly locale: string, readonly namespace: string, readonly format: I18NFileFormat) {}
}

export class I18NWorkspace {
  resources = [] as I18NResource[]
  namespaces = new Set<string>()
  locales = new Set<string>()

  private constructor(private root: Tree) {
  }

  private async load() {
    const config = JSON.parse(await this.root.readBlob("i18n.config.json")) as I18NConfig
    this.resources = (await Promise.all(config.resources.map(r => this.scanResources(r.filePathPattern, {format: r.format})))).reduce((a,b) => a.concat(b))
    this.namespaces = new Set(this.resources.map(r => r.namespace))
    this.locales = new Set(this.resources.map(r => r.locale))
  }

  private async scanResources(pattern: string, context: {namespace?: string, locale?: string, format?: I18NFileFormat}, tree = this.root, path : string | null = null) : Promise<I18NResource[]> {
    let idx = pattern.indexOf("/")
    let p = new RegExp("^" + (idx === -1 ? pattern : pattern.substring(0, idx)) + "$")
    let restOfPattern = idx === -1 ? null : pattern.substring(idx + 1)
    let resources = [] as I18NResource[]

    const l = await(tree.list())
    for(let entry of l) {
      let match = p.exec(entry.path)
      if(match) {
        const groups = match.groups ?? {}
        const newContext = {
          namespace: groups.namespace ? context.namespace ? context.namespace + ":" + groups.namespace : groups.namespace : context.namespace,
          locale: groups.locale ?? context.locale,
          format: context.format
        }
        const fullPath = path ? path + "/" + entry.path : entry.path;

        if(restOfPattern && entry.type === 'tree') {
          resources = resources.concat(await this.scanResources(restOfPattern, newContext, await tree.subTree(entry.path), fullPath))
        } else if(!restOfPattern && entry.type === 'blob') {
          resources.push(new I18NResource(fullPath, newContext.locale!, newContext.namespace!, newContext.format!))
        }
      }
    }

    return resources
  }

  static async load(root: Tree) {
    const ws = new I18NWorkspace(root)
    await ws.load()
    return ws
  }
}
