const Authenticator = window.netlify.default;

function p(params) {
  return Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

class GitHub {
  clientId = "c5f22ce7ba042048bdf8";

  async login() {
    const authenticator = new Authenticator({});
    authenticator.site_id = "cfe4a4fd-b125-4d6c-9d56-fd286fc807cf";

    return new Promise((resolve, reject) => {
      authenticator.authenticate(
          // Set the OAuth provider and token scope
          // Provider can be "github", "gitlab", or "bitbucket"
          // The scopes available depend on your OAuth provider
          { provider: "github", scope: "repo" },
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

class Project {
  constructor(github, owner, project) {
    this.github = github;
    this.owner = owner;
    this.project = project;
  }

  async listBranches() {
    const result = await github.fetch(
        `/repos/${this.owner}/${this.project}/branches`)
    return result
  }
}

window.github = new GitHub();
