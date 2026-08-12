# First Draft Drawing Board

This template is a disposable workspace for describing one application. The intended path is deliberately simple:

**Use this template → create a Codespace → add one First Draft token → run `claude` or `codex` → describe
the app → receive a new private GitHub repository.**

This repository remains the drawing board. A successful Compile creates the application in a **fresh private
repository** owned by the GitHub account connected to First Draft. It does not add generated files or open a pull
request here, and the product flow does not require a GitHub personal access token.

## Make an app with Claude or Codex

1. Select **Use this template** on GitHub and create your own repository.
2. In that repository, select **Code → Codespaces → Create codespace on main**.
3. Wait for the post-create setup to finish. Create a First Draft API token at
   <https://staging.firstdraft.com/api-tokens>. This is not a GitHub PAT.
4. Open the generated `.env` file in the Codespace editor. Paste the token into the `FIRSTDRAFT_API_TOKEN` entry,
   save the file, and leave the staging URL unchanged. `.env` is mode `0600` and ignored by
   Git; do not paste its contents into agent chat or a shell command. It is a pragmatic development credential file
   that Claude and Codex can read, not a secret boundary between the token and either agent.
5. Run either agent from the repository root:

   ```sh
   claude
   # or: codex
   ```

   Complete that agent's sign-in and trust prompts if they appear. You do not need to configure First Draft through
   `/plugin`.
6. Say what you want in ordinary language, for example:

   > Make me an app that helps me inventory my home.
7. Answer the agent's follow-up questions. On success, it reports the URL of the fresh private application
   repository. Open that repository in a new checkout or Codespace to continue working on the generated app.

If setup appeared incomplete, exit the agent and run `bin/agent-doctor --installation-only`. If a First Draft
command reports an authentication or origin problem, run `bin/agent-doctor`; it validates `.env` and reports token
presence without printing the value. If it reports a permissions problem, run `chmod 600 .env` and try again.

The current First Draft path is experimental and intentionally narrow. Claude may help reshape an idea to the
currently supported Foundation Plan and generated surfaces. Compile creates the repository; it does not deploy the
application.

## The shared First Draft command

The Codespace puts this repository's `bin/firstdraft` ahead of global executables, and the agent instructions call
that wrapper explicitly in every environment. The wrapper reads only `FIRSTDRAFT_API_URL` and
`FIRSTDRAFT_API_TOKEN` from the ignored `.env`, rejects another origin, checks the pinned CLI version, and then
launches that CLI. Claude and Codex therefore use the same credential and staging origin. On a local clone, the
current directory is not automatically on `PATH`; invoke `bin/firstdraft` explicitly instead of relying on a bare
`firstdraft` command. No shell `source`, Codespaces secret, GitHub PAT, or `/plugin` configuration is required.

Authenticate Codex when you choose it:

```sh
codex login --device-auth
```

Start Codex from the repository root with `codex`. In a Codespace, bare `firstdraft` terminal commands resolve to
the same repository wrapper the agents use; on a local clone, use `bin/firstdraft`. Codex keeps local command
network access off by default and may ask you to approve an expected staging First Draft request; approve only the
exact `bin/firstdraft` command you intend to run.

## Production and staging

The published standalone CLI defaults to production, but this Drawing Board's wrapper requires
`https://staging.firstdraft.com` from `.env`. Use a token created by staging. The CLI pins the origin after the first
successful push; an existing Drawing Board cannot later be switched to another service.

Claude's sensitive plugin configuration does not reach a Skill's ordinary Bash command, so it is not the
credential path for this release. A future narrow MCP bridge can restore secure plugin-owned delivery without
exporting the token to general Bash; that improvement is tracked in
[firstdraft/skills#27](https://github.com/firstdraft/skills/issues/27).

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
exact Skills revision and links the same `create-full-stack-app` Skill into Claude's and Codex's documented personal
Skill directories. It also installs exact versions of Claude Code, Codex, and the standalone First Draft CLI. Ruby,
Rails, PostgreSQL, and Foundation Rails Core dependencies belong to the generated repository and are installed there
after Compile.

Agent authentication is retained in named volumes across container rebuilds and is deleted with the Codespace.
Setup creates `.env` from the non-secret `.env.example` only when it is absent and never overwrites it. The user adds
the token locally; Git ignores that file, but processes and agents in the Codespace can read it.

Run `script/check` for repository contract checks. The hosted CI workflow also builds the real devcontainer and
verifies the installed versions, shared `.env` wrapper, and both pinned Skill links.
