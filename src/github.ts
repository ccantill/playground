import Authenticator from "netlify-auth-providers";

export namespace GitHubInternal {
  export type TreeEntry = {
    path: string
    mode: string
    type: "blob" | "tree" | "commit"
    size: number
    sha: string
    url: string
  };

  export interface TreeInfo {
    sha: string
    url: string
    tree: TreeEntry[]
    truncated: boolean
  }

  export interface BranchInfo {
    name: string
  }

  export interface OrganizationInfo {
    login: string
    url: string
  }

  export interface RepositoryInfo {
    name: string
    full_name: string
    private: boolean
    description: string
  }

  export interface UserInfo {
    login: string
    url: string
    avatar_url: string
  }

  export interface RefInfo {
    "ref": string
    "node_id": string
    "url": string
    "object": {
      "type": string
      "sha": string
      "url": string
    }
  }

  export interface BlobInfo {
    "content": string,
    "encoding": BufferEncoding
    "url": string
    "sha": string
    "size": number
    "node_id": string
  }

}

export enum Errors {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  NOT_A_FILE = "NOT_A_FILE",
  NOT_A_TREE = "NOT_A_TREE"
}

export interface TreeEntry {
  path: string
  type: "blob" | "tree" | "commit"
}

export interface Tree {
  readBlob(name: string): Promise<string>
  subTree(name: string) : Promise<Tree>

  list() : Promise<TreeEntry[]>
}

export class GitHubTree implements Tree {
  constructor(private workspace: Workspace, private data: GitHubInternal.TreeInfo) {
  }

  async readBlob(name: string): Promise<string> {
    const entry = this.searchTree(name)
    if (!entry) throw new Error("FILE_NOT_FOUND");
    if(entry.type !== "blob") throw new Error(Errors.NOT_A_FILE)
    console.debug(`Reading blob ${entry.path}`)
    let blobInfo = await this.workspace.fetchJson(`git/blobs/${entry.sha}`) as GitHubInternal.BlobInfo;
    return atob(blobInfo.content)
  }

  private searchTree(name: string) : GitHubInternal.TreeEntry | undefined {
    return this.data.tree.find(d => d.path === name);
  }

  async subTree(name: string) : Promise<Tree> {
    const entry = this.searchTree(name)
    if(!entry) throw new Error(Errors.FILE_NOT_FOUND);
    if(entry.type !== "tree") throw new Error(Errors.NOT_A_TREE)
    console.debug(`Listing tree ${entry.path}`)
    return await this.workspace.getTree(entry.sha)
  }

  list() : Promise<TreeEntry[]> {
    return Promise.resolve(this.data.tree)
  }
}

export class Workspace {
  public constructor(private client: GitHub, private fullName: string) {
  }

  async listBranches() : Promise<GitHubInternal.BranchInfo[]> {
    return this.fetchJson(`branches?per_page=100`)
  }

  async fetch(url: string) {
    return this.client.fetch(`/repos/${this.fullName}/${url}`)
  }

  async fetchJson(url: string) {
    return (await this.fetch(url)).json()
  }

  async branch(name: string) {
    const ref = await this.getRef(`heads/${name}`)
    return await this.getTree(ref.object.sha)
  }

  async getTree(sha: string) {
    return new GitHubTree(this, await this.fetchJson(`git/trees/${sha}`));
  }

  async getRef(name: string) {
    return this.fetchJson(`git/ref/${name}`)
  }
}

export class GitHub {
  private token: string | null = null;

  async login() {
    let ghToken = sessionStorage.getItem("gh_token");
    if(ghToken) {
      this.token = ghToken;
    } else {
      const authenticator = new Authenticator({site_id: "cfe4a4fd-b125-4d6c-9d56-fd286fc807cf"});

      return new Promise<void>((resolve, reject) => {
            authenticator.authenticate(
                // Set the OAuth provider and token scope
                // Provider can be "github", "gitlab", or "bitbucket"
                // The scopes available depend on your OAuth provider
                {provider: "github", scope: "repo"},
                async (error, data) => {
                  if (error) {
                    console.error(error);
                    reject(error);
                  } else {
                    this.token = data.token;
                    sessionStorage.setItem("gh_token", data.token);
                    console.log("Authenticated with GitHub. Access Token: " + data.token);
                    resolve();
                  }
                }
            );
          }
      );
    }
  }

  async organizations() {
    return await (await this.fetch('/user/orgs')).json() as GitHubInternal.OrganizationInfo[]
  }

  async userRepositories() {
    return await this.fetchJson('/user/repos') as GitHubInternal.RepositoryInfo[]
  }

  async repositories(ownerUrl: string) {
    return await (await this.fetch('/' + this.localize(ownerUrl) + '/repos?per_page=100')).json() as GitHubInternal.RepositoryInfo[]
  }

  async getUser() {
    return await (await this.fetch('/user')).json() as GitHubInternal.UserInfo
  }

  private localize(url: string) {
    return url.replace(/.*\.com\//, '')
  }

  workspace(fullName: string) : Workspace {
    return new Workspace(this, fullName);
  }

  fetch(url: string, opts?: RequestInit) {
    return fetch('/api' + url, {
      ...opts,
      headers: {
        ...opts?.headers,
        Accept: "application/vnd.github.v3+json",
        Authorization: "token " + this.token
      }
    })
  };

  async fetchJson(url: string, opts?: RequestInit) {
    return (await this.fetch(url, opts)).json()
  }
}
