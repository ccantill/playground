import Authenticator from "https://unpkg.com/netlify-auth-providers";

function p(params) {
  return Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

class GitHub {
  clientId = "c5f22ce7ba042048bdf8";

  async login() {
    const authenticator = new Authenticator({});
    return new Promise((resolve, reject) => {
      authenticator.authenticate(
          // Set the OAuth provider and token scope
          // Provider can be "github", "gitlab", or "bitbucket"
          // The scopes available depend on your OAuth provider
          { provider: "github", scope: "user" },
          async (error, data) => {
            if (error) {
              console.error(error);
              reject(error);
            } else {
              this.token = data.token;
              console.log("Authenticated with GitHub. Access Token: " + data.token);
              resolve();
            }
          }
      );
    })
  }

  project(owner, project) {
    return new Project(this, owner, project);
  }

  fetch(url, opts) {
    return fetch(url, {
      ...opts,
      headers: {
        ...opts.headers,
        "Authenticate": "token " + this.token
      }
    })
  };
}

class Project {
  constructor(github, owner, project) {
    this.github = github;
    this.owner = owner;
    this.project = project;
  }

  async listBranches() {
    const result = await github.fetch(
        `/api/repos/${this.owner}/${this.project}/branches`)
    return result
  }
}

window.github = new GitHub();
