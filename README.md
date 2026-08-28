# Build an app with First Draft

This repository is a workspace for planning an app with Claude or Codex. You describe what you want, your agent asks
questions, and First Draft creates a new private GitHub repository containing a working Rails application.

You do not need to install programming tools on your computer. The GitHub Codespace created from this template
contains everything the agent needs.

## Before you start

You will need:

- a personal GitHub account;
- access to <https://staging.firstdraft.com>; and
- a Claude or Codex account.

Use the same personal GitHub account throughout the process. That account will own the generated application
repository.

## 1. Create your Drawing Board

1. Open [firstdraft/drawing-board](https://github.com/firstdraft/drawing-board).
2. Select **Use this template**, then **Create a new repository**.
3. Give the repository a name for your app idea and select **Create repository**.

This repository is your Drawing Board. The generated application will be created later in a different repository.

## 2. Open the Codespace

1. In your new Drawing Board repository, select **Code**.
2. Select **Codespaces**.
3. Select **Create codespace on main**.
4. Wait for the terminal to say `Drawing Board setup complete.`

The first setup may take a few minutes. Leave the browser tab open while it finishes.

## 3. Connect First Draft to GitHub

1. Open <https://staging.firstdraft.com> in another browser tab.
2. Select **Sign in with GitHub**.
3. On the Projects page, select **Connect GitHub App**.
4. Follow GitHub's prompts to install the App on your personal account.

If GitHub asks which repositories the App may access, **Only select repositories** is sufficient. GitHub
automatically gives the App access to repositories it creates.

The requested repository permissions let First Draft create the private repository, write the application source,
and include its GitHub Actions workflow. They do not give the App access to unselected existing repositories.

## 4. Add your First Draft token

1. In First Draft, open <https://staging.firstdraft.com/api-tokens>.
2. Create a token and copy it.
3. Return to the Codespace.
4. In the file list, open `.env`.
5. Paste the token after the equals sign on the `FIRSTDRAFT_API_TOKEN` line and save the file. Leave the URL on the
   first line unchanged.

The token is not a GitHub password or personal access token. Keep it out of chat, screenshots, and commits.

## 5. Describe your app

Open the Codespace terminal and start either agent:

```sh
claude
# or
codex
```

If you choose Codex, run `codex login --device-auth` first and follow the code prompt. Complete any other agent
sign-in prompts that appear. Then describe the app in ordinary language. For example:

> Make me an app that helps me keep track of the plants in my home.

Answer the agent's follow-up questions. It will turn your answers into a Foundation Plan, ask you to review the
important choices, and show you anything the generated application will leave for later work.

When the Plan looks right, approve the Compile. First Draft will create a new private GitHub repository and the
agent will give you its URL.

Codex may ask permission for an exact `bin/firstdraft ...` command to contact `staging.firstdraft.com`. Approve that
command; do not grant unrelated network access.

## 6. Open your application

Open the new repository from the URL the agent provides. This is the Rails application you will continue working
on; the Drawing Board remains a separate planning workspace.

The generated repository includes:

- runnable application source and tests;
- the exact submitted Foundation Plan at `.firstdraft/submitted-foundation-plan.json`; and
- the reviewed list of remaining work at `.firstdraft/gaps.json`.

Create a Codespace in the generated repository and follow its README to run the application and continue building
it with your agent.

## Troubleshooting

If the initial Codespace setup did not finish, run:

```sh
bin/agent-doctor --installation-only
```

If the doctor reports that an agent, CLI, or Skill is unavailable or mismatched, run
`.devcontainer/setup-agents` again; it is safe to repeat. If that still fails, use **Codespaces: Rebuild Container**.

If a First Draft command reports a token, origin, or `.env` problem, run:

```sh
bin/agent-doctor
```

The doctor reports whether the token is present without showing it. If it reports an `.env` permissions problem,
run `chmod 600 .env` and try again.

First Draft is currently an internal preview. Use it for test projects. Compile creates a private GitHub repository;
it does not deploy the application.

Maintaining this template? Read [CONTRIBUTING.md](CONTRIBUTING.md).
