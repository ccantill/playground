import React, {useEffect, useState} from 'react';
import './App.css';
import {
  GitHub,
  GitHubInternal,
  Workspace
} from "./github";
import OrganizationInfo = GitHubInternal.OrganizationInfo;
import RepositoryInfo = GitHubInternal.RepositoryInfo;
import BranchInfo = GitHubInternal.BranchInfo;
import UserInfo = GitHubInternal.UserInfo;
import {I18NWorkspace} from "./i18n";

const gh = new GitHub();


function App() {
  const [orgs, setOrgs] = useState([] as OrganizationInfo[])
  const [repos, setRepos] = useState([] as RepositoryInfo[])
  const [branches, setBranches] = useState([] as BranchInfo[])

  const [user, setUser] = useState(null as UserInfo | null)
  const [selectedOrg, selectOrg] = useState(null as string | null)
  const [selectedRepo, selectRepo] = useState(null as string | null)
  const [selectedBranch, selectBranch] = useState(null as string | null)
  const [workspace, selectWorkspace] = useState(null as Workspace | null)
  const [i18nWorkspace, openWorkspace] = useState(null as I18NWorkspace | null)

  if (!user) {
    gh.login().then(() => {
      gh.getUser().then(setUser)
    })
  }

  useEffect(() => {
    if (user) {
      gh.login().then(() => {
        gh.organizations().then(orgs => {
          setOrgs(orgs)
          selectOrg("<myown>")
        });
      })
    }
  }, [user])

  useEffect(() => {
    if (selectedOrg) {
      gh.login().then(() => {
        if(selectedOrg === "<myown>") {
          gh.userRepositories().then(setRepos)
        } else {
          gh.repositories(selectedOrg).then(setRepos);
        }
      })
    }
  }, [selectedOrg])

  useEffect(() => {
    if (selectedOrg && selectedRepo) {
      gh.login().then(() => {
        selectWorkspace(gh.workspace(selectedRepo))
      })
    }
  }, [selectedOrg, selectedRepo])

  useEffect(() => {
    if (workspace) {
      workspace.listBranches().then(setBranches);
    }
  }, [workspace])

  useEffect(() => {
    async function doIt() {
      if (workspace && selectedBranch && selectedRepo && selectedOrg) {
        const root = await workspace.branch(selectedBranch)
        openWorkspace(await I18NWorkspace.load(root))
      }
    }

    doIt();
  }, [selectedBranch])

  return (
      <div>
        <div className="githubSetup">
          {user && <img src={user.avatar_url} className="avatar"/>}
          <div className="userInfo">Logged in as {user?.login}</div>
          <div className="selector">
            <select onChange={evt => selectOrg(evt.target.value)}>
              <option key="personal" value="<myown>">Personal ({user?.login})</option>
              {orgs.map(org => <option key={"org-" + org.login}
                                       value={org.url}>{org.login}</option>)}
            </select>
            <select onChange={evt => selectRepo(evt.target.value)}>{repos.map(repo => <option
                key={"repo-" + repo.name} value={repo.full_name}>{repo.name}</option>)}</select>
            <select onChange={evt => selectBranch(evt.target.value)}>{branches.map(branch => <option
                key={"branch-" + branch.name} value={branch.name}>{branch.name}</option>)}</select>
          </div>
        </div>
        <div className="workarea">
          <div className="namespaceSelector">
            {i18nWorkspace ?
                <select>
                  {[...i18nWorkspace.namespaces].map(ns => <option key={ns} value={ns}>{ns}</option>)}
                </select>
                :
                <p>No namespaces found </p>
            }
          </div>
          <div className="resourceEditor">
            <div className="resource">
            </div>
          </div>
        </div>
      </div>
  );
}

export default App;
