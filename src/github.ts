import Authenticator from "netlify-auth-providers";

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
    return await (await this.fetch('/user/orgs')).json() as OrganizationInfo[]
  }

  async repositories(org: string) {
    return await (await this.fetch('/orgs/' + org + '/repos?per_page=100')).json() as RepositoryInfo[]
  }

  async listBranches(org: string, repo: string) : Promise<BranchInfo[]> {
    const result = await this.fetch(
        `/repos/${org}/${repo}/branches?per_page=100`)
    return await result.json()
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
}

export interface BranchInfo {
  name: string
}

export interface OrganizationInfo {
  login: string
}

export interface RepositoryInfo {
  name: string
  full_name: string
  private: boolean
  description: string
}
