# First Draft Drawing Board

This template is a disposable workspace for describing one application. The intended path is deliberately simple:

**Use this template → create a Codespace → run `claude` → describe the app → receive a new private GitHub repository.**

This repository remains the drawing board. A successful Compile creates the application in a **fresh private
repository** owned by the GitHub account connected to First Draft. It does not add generated files or open a pull
request here, and the product flow does not require a GitHub personal access token.

## Make an app with Claude

1. Select **Use this template** on GitHub and create your own repository.
2. In that repository, select **Code → Codespaces → Create codespace on main**.
3. Wait for the post-create setup to finish, then run Claude from the repository root:

   ```sh
   claude
   ```

   Complete Claude's sign-in and trust prompts if they appear.
4. The first time you use First Draft in this Codespace, create a First Draft API token at
   <https://staging.firstdraft.com/api-tokens>. This is not a GitHub PAT. In Claude, run `/plugin`, select
   **Installed → First Draft → Configure**, and enter it only in the sensitive token field. Setup has already
   selected staging's non-secret URL; do not put the token or URL in a repository file or agent chat.
5. Say what you want in ordinary language, for example:

   > Make me an app that helps me inventory my home.
6. Answer Claude's follow-up questions and approve the exact Compile when you are ready. On success, Claude reports
   the URL of the fresh private application repository. Open that repository in a new checkout or Codespace to
   continue working on the generated app.

If setup appeared incomplete, exit Claude and run `bin/agent-doctor --installation-only`. This checks the installed
tools and plugin without inspecting or printing the sensitive token.

The current First Draft path is experimental and intentionally narrow. Claude may help reshape an idea to the
currently supported Foundation Plan and generated surfaces. Compile creates the repository; it does not deploy the
application.

## Optional: Use Codex or the standalone CLI

The Claude path above does not require Codespaces secrets. Codex and direct terminal use of the standalone
`firstdraft` CLI cannot access Claude's secure plugin configuration, so configure their environment separately.

Authenticate Codex if you want to use it:

```sh
codex login --device-auth
```

Add the staging token as a personal GitHub Codespaces secret named `FIRSTDRAFT_API_TOKEN`, grant it to your Drawing
Board repository, and add `FIRSTDRAFT_API_URL` with the value `https://staging.firstdraft.com`. Restart the Codespace
so those variables reach Codex and terminal commands, then run `bin/agent-doctor` to verify credential presence and
that the standalone and Claude clients target the same service. It reports presence only and never prints either
token.

The full doctor is the two-client check and intentionally expects the Codespaces token and Codex authentication. In
a Claude-only workspace, use `bin/agent-doctor --installation-only` instead.

Start Codex from the repository root with `codex`. The standalone `firstdraft` command is also available there.

## Update an existing Codespace

The current Drawing Board registers an exact local catalog checkout, so a coordinated Claude-and-Codex update
requires a fresh repository from the updated template. To refresh only Claude's plugin in an existing Codespace,
explicitly switch that workspace to the current public catalog. This gives up the template's exact release pin.

Register the public marketplace, then inspect its available release and the installed plugin scope:

```sh
claude plugin marketplace add firstdraft/skills --scope local
claude plugin marketplace list --json
claude plugin marketplace update firstdraft-skills
claude plugin list --available --json
claude plugin list --json
```

After the available version reports `0.1.0`, update using the `scope` shown for
`firstdraft@firstdraft-skills` (normally `local` in a Drawing Board):

```sh
claude plugin update firstdraft@firstdraft-skills --scope local
```

If GitHub shorthand cannot clone in that Codespace, register the same public marketplace over HTTPS instead:

```sh
claude plugin marketplace add https://github.com/firstdraft/skills.git --scope local
claude plugin marketplace update firstdraft-skills
claude plugin list --available --json
```

This rebind lasts only until the next container rebuild. Rebuilding reruns setup, restores the template's exact
catalog checkout, and expects the plugin version pinned by that template. Use a fresh repository for a durable,
coordinated update; rerun `.devcontainer/setup-agents` to restore the existing template pin immediately.

If the plugin is not installed, install it instead of updating it:

```sh
claude plugin install firstdraft@firstdraft-skills --scope local
```

Restart Claude after an update, or run `/reload-plugins` in an active session. An update preserves the plugin's
configured URL and token. Removing the last installed scope or removing its marketplace can clear that
configuration, so removal and reinstallation are recovery steps that require configuring the plugin again.

## Production and staging

The standalone First Draft CLI defaults to `https://firstdraft.com`. This repository does not override that
default. Setup configures the current Claude plugin for `https://staging.firstdraft.com` as part of the
qualification release.

For a staging qualification, set the Codespaces secret `FIRSTDRAFT_API_URL` to
`https://staging.firstdraft.com` for Codex and standalone CLI commands; Claude is already configured for staging.
Use `/plugin` to change Claude's origin if you deliberately select production instead. Claude's
[user-configuration contract](https://code.claude.com/docs/en/plugins-reference#user-configuration) deliberately
ignores `pluginConfigs` in project and local settings; non-sensitive plugin options live in Claude's user settings
and the token lives in its secure credential storage. Those options are available to the plugin inside Claude, not
to ordinary terminal commands or Codex; those clients use the Codespaces environment variables instead.

`bin/agent-doctor` reads only the non-sensitive Claude plugin URL from Claude's user settings and compares it with
the standalone CLI's effective URL. It does not read Claude's sensitive token storage.

Use a token created by the selected origin. The CLI pins the origin after the first successful push; an existing
Drawing Board cannot later be switched to another service.

## Optional: Ask one agent to review the other

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

The devcontainer starts from Microsoft's prebuilt Node development image and adds GitHub CLI. It checks out one
exact Skills revision, installs the public First Draft plugin release from that checkout's catalog, and links the
same checkout's Skill for Codex. Ruby, Rails, PostgreSQL, and Foundation Rails Core dependencies belong to the
generated repository and are installed there after Compile.

Agent authentication and Claude's user-scoped plugin configuration are retained in named volumes across container
rebuilds and are deleted with the Codespace. Setup writes only the non-secret staging URL; the image and repository
contain no credentials. Codespaces secrets are visible to processes running in the container, so they are
credential delivery rather than isolation between agents.

Run `script/check` for repository contract checks. The hosted CI workflow also builds the real devcontainer and
verifies the installed versions, Claude plugin user-configuration contract, and pinned Codex Skill.
