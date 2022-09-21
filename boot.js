export class Project {
  owner = "unifly-aero"
  project = "unifly-portal"

  async listBranches() {
    const result = await fetch(`https://api.github.com/repos/${this.owner}/${this.project}/branches`)
    return result
  }
}

new Project().listBranches().then(r => console.log(r));
