import React, {useEffect, useState} from 'react';
import './App.css';
import {BranchInfo, GitHub, OrganizationInfo, RepositoryInfo} from "./github";

const gh = new GitHub();

function App() {
  const [orgs, setOrgs] = useState([] as OrganizationInfo[]);
  const [repos, setRepos] = useState([] as RepositoryInfo[]);
  const [branches, setBranches] = useState([] as BranchInfo[]);

  const [selectedOrg, selectOrg] = useState(null as string | null);
  const [selectedRepo, selectRepo] = useState(null as string | null);
  const [selectedBranch, selectBranch] = useState(null as string | null);

  useEffect(() => {
    gh.login().then(() => {
      gh.organizations().then(orgs => {
        setOrgs(orgs);
        if(orgs.length == 1) {
          selectOrg(orgs[0].login);
        }
      });
    })
  }, [])

  useEffect(() => {
    if(selectedOrg) {
      gh.login().then(() => {
        gh.repositories(selectedOrg).then(setRepos);
      })
    }
  }, [selectedOrg])

  useEffect(() => {
    if(selectedOrg && selectedRepo) {
      gh.login().then(() => {
        gh.listBranches(selectedOrg, selectedRepo).then(setBranches);
      })
    }
  }, [selectedOrg, selectedRepo])

  return (
    <div className="App">
      <header className="App-header">
        <select onChange={evt => selectOrg(evt.target.value)}>{ orgs.map(org => <option value={org.login}>{org.login}</option>) }</select>
        <select onChange={evt => selectRepo(evt.target.value)}>{ repos.map(repo => <option value={repo.name}>{repo.name}</option>) }</select>
        <select onChange={evt => selectBranch(evt.target.value)}>{ branches.map(branch => <option value={branch.name}>{branch.name}</option>) }</select>
      </header>
    </div>
  );
}

export default App;
