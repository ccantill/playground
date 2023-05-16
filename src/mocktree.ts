import {Errors, Tree, TreeEntry} from "./github";

export interface MockTreeConfig {
  [filename: string] : string | MockTreeConfig
}

export class MockTree implements Tree {
  constructor(private config: MockTreeConfig) {

  }

  readBlob(name: string): Promise<string> {
    if(!(name in this.config)) {
      throw new Error("FILE_NOT_FOUND")
    }
    let entry = this.config[name];
    if(typeof entry !== 'string') {
      throw new Error(Errors.NOT_A_FILE)
    }
    return Promise.resolve(entry)
  }

  subTree(name: string): Promise<Tree> {
    if(!(name in this.config)) {
      throw new Error("FILE_NOT_FOUND")
    }
    let entry = this.config[name];
    if(typeof entry !== 'object') {
      throw new Error(Errors.NOT_A_TREE)
    }
    return Promise.resolve(new MockTree(entry))
  }

  list(): Promise<TreeEntry[]> {
    return Promise.resolve(Object.entries(this.config).map(([key, value]) => ({
      path: key,
      type: typeof(value) === "string" ? "blob" : "tree"
    })))
  }
}
