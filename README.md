# First Draft Drawing Board

Start an application by talking with Claude Code or Codex in one shared, disposable workspace. The agent interviews
you, maintains a Foundation Plan, and can ask First Draft to compile a valid candidate into a **separate private
GitHub repository**.

This repository is the drawing board, not the generated Rails application. After Compile succeeds, continue in a
new checkout or Codespace created from the GitHub repository URL returned by First Draft.

## Start in a Codespace

1. Select **Use this template** on GitHub and create your own repository.
2. In that repository, select **Code → Codespaces → Create codespace on main**.
3. Wait for the post-create setup to install the pinned Claude Code, Codex, First Draft CLI, and First Draft Skill.
4. Authenticate the two agents in the Codespace terminal:

   ```sh
   claude auth login
   codex login --device-auth
   ```

5. Create a First Draft API token at <https://firstdraft.com/api-tokens>. Never paste it into an agent conversation
   or put it on a command line.
6. For Codex and the standalone CLI, add the token as a personal GitHub Codespaces secret named
   `FIRSTDRAFT_API_TOKEN`, grant it to your new repository, and restart the Codespace. For Claude, start `claude`,
   trust the repository, accept the project plugin installation, and enter the token in the plugin's sensitive
   configuration prompt.
7. Run `bin/agent-doctor`. It reports credential presence but never prints credential values.

Start either agent from the repository root:

```sh
claude
# or
codex
```

Then say, for example:

> Let's make an app that helps me inventory my home.

The current First Draft path is experimental and intentionally narrow. The installed Skill tells the agent which
Foundation Plan features and generated surfaces are currently supported. Compile creates a private GitHub
repository; it does not deploy the application.

## Production and staging

The standalone First Draft CLI defaults to `https://firstdraft.com`. This repository does not override that
default. Claude's checked-in project configuration selects the same production origin.

For a staging qualification, set the Codespaces secret `FIRSTDRAFT_API_URL` to
`https://staging.firstdraft.com` for Codex and standalone CLI commands. Also create the ignored file
`.claude/settings.local.json` so Claude's plugin uses that same origin:

```json
{
  "pluginConfigs": {
    "firstdraft@firstdraft-skills": {
      "options": {
        "api_url": "https://staging.firstdraft.com"
      }
    }
  }
}
```

Use a token created by the selected origin. The CLI pins the origin after the first successful push; an existing
Drawing Board cannot later be switched to another service.

## Ask one agent to review the other

Only one agent should edit the Plan at a time. The other can inspect the current ignored Plan and the installed
Skill in a read-only review:

```sh
bin/review-plan-with-claude
bin/review-plan-with-codex
```

The Foundation Plan and its private concurrency state live under `.firstdraft/`, which the CLI deliberately keeps
out of Git. The review commands read the current Plan directly rather than relying on a Git diff. Evaluate the
review before asking the authoring agent to revise the Plan.

## What the Codespace contains

The devcontainer starts from Microsoft's prebuilt Node development image and adds GitHub CLI. It installs only the
agent tooling needed on the drawing board; Ruby, Rails, PostgreSQL, and Foundation Rails Core dependencies belong
to the generated repository and are installed there after Compile.

Agent authentication is retained in named volumes across container rebuilds and is deleted with the Codespace.
The image and repository contain no credentials. Codespaces secrets are visible to processes running in the
container, so they are credential delivery rather than isolation between agents.

Run `script/check` for repository contract checks. The hosted CI workflow also builds the real devcontainer and
verifies the installed versions and pinned Codex Skill.
