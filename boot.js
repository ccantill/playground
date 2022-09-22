function p(params) {
  return Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

class GitHub {
  clientId = "c5f22ce7ba042048bdf8";

  async login() {
    if (document.location.search.startsWith("?code=")) {
      await this.exchangeToken(document.location.search.substring(6))
    } else {
      document.location = `https://github.com/login/oauth/authorize?scope=user:email&client_id=${this.clientId}`
    }
  }

  async exchangeToken(code) {
    {
      const params = {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirectUri: 'https://ccantill.github.io/playground/' //document.location.origin + document.location.pathname
      }
      const tokenResponse = await fetch(
          "/oauth/access_token?" + p(params), {
            method: "POST",
            headers: {
              'Accept': 'application/json'
            }
          });

      const tokenObj = tokenResponse.json();

      console.log(tokenObj);
    }
  }
}

class Project {
  owner = "unifly-aero"
  project = "unifly-portal"

  async listBranches() {
    const result = await fetch(
        `/api/repos/${this.owner}/${this.project}/branches`)
    return result
  }
}

window.github = new GitHub();
