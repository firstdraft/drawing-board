# Build an app with First Draft

This repository is a workspace for building an app with Claude or Codex. Describe your idea, review the plan with
your agent, and First Draft generates a Rails starting point at this repository's root. The original Drawing Board
files move into `design/`; your Git history and remote stay in place. Keep working with the same agent to make it
your own.

You do not need to install programming tools on your computer. The GitHub Codespace created from this template
contains everything the agent needs.

The path is: **describe → review → generate → open → inspect → change → save**. You stay in the same Codespace throughout.
First Draft is an internal alpha: use test projects and sample data. The generated app is a head start, not a
finished product. Sharing code is enough for this test; deployment is optional.

## Before you start

You will need:

- a personal GitHub account;
- access to <https://staging.firstdraft.com>; and
- a Claude or Codex account with access to its coding agent.

Use the same personal GitHub account for the Drawing Board, Codespace, and First Draft sign-in.

## 1. Create your Drawing Board

1. Open [firstdraft/drawing-board](https://github.com/firstdraft/drawing-board).
2. Select **Use this template**, then **Create a new repository**.
3. Give the repository a name for your app idea, choose **Private**, and select **Create repository**.

This repository starts as your Drawing Board and becomes your application after you approve root Compile.

## 2. Open the Codespace

1. In your new Drawing Board repository, select **Code**.
2. Select **Codespaces**.
3. Select **Create codespace on main**.
4. Wait for the terminal to say `Drawing Board setup complete.`

The first setup may take a few minutes. Leave the browser tab open while it finishes.
The workspace starts its database automatically. Browser tests start their browser service only when they need it,
so the first browser-test run may take a little longer while that service downloads.

## 3. Sign in to First Draft

1. Open <https://staging.firstdraft.com> in another browser tab.
2. Select **Sign in with GitHub**.
3. Leave that browser tab open so you can create the token in the next step.

This sign-in is enough for the ordinary in-workspace path. If you want First Draft to create a separate private
GitHub repository instead, also select **Connect GitHub App** and follow GitHub's prompts. **Only select
repositories** is sufficient; GitHub automatically gives the App access to repositories it creates.

For that optional Publication path, the requested permissions let First Draft create the private repository, write
the application source, and include its GitHub Actions workflow. They do not give the App access to unselected
existing repositories.

## 4. Add your First Draft token

1. In First Draft, open <https://staging.firstdraft.com/api-tokens>.
2. Create a token and copy it.
3. Return to the Codespace.
4. In the file list, open `.env`.
5. Paste the token after the equals sign on the `FIRSTDRAFT_API_TOKEN` line and save the file. Leave the URL on the
   first line unchanged.

The token is not a GitHub password or personal access token. Keep it out of chat, screenshots, and commits.

## 5. Describe your app

Open the Codespace terminal and choose **one** agent. Drawing Board has already installed both agents and the First
Draft Skill; you do not need to install a plugin separately.

For Claude, run this and follow its sign-in prompts:

```sh
claude
```

Use the account that already has Claude Code access. If the browser does not open, press `c` at the login prompt to
copy the full URL, then open it in your browser. If the browser shows a login code, paste it into the terminal's
`Paste code here if prompted` field, not into chat. Wait for the terminal to confirm the login.

If pasting into that interactive field does nothing, return to the shell and run:

```sh
claude auth login
```

Open the URL it prints and paste the returned code into its terminal prompt; this command reads the code from
standard input. Then run `claude` again. Do not copy credentials between machines or create a new account to work
around a login problem. See [Claude's official container-login fallback](https://code.claude.com/docs/en/troubleshoot-install#oauth-login-fails-in-wsl2-ssh-or-containers).

For Codex, sign in the first time, then start the agent:

```sh
codex login --device-auth
codex
```

For device sign-in, leave the terminal waiting, open the address it prints in your browser, and enter that terminal's
one-time code. If device login is unavailable, enable it in your ChatGPT security settings or follow
[OpenAI's remote sign-in guide](https://learn.chatgpt.com/docs/auth#login-on-headless-devices). Once signed in, you can
start later sessions with just `codex`; you do not need to log in again for every Compile.

Then describe the app in ordinary language. For example:

> Make me an app that helps me keep track of the plants in my home.

Answer the agent's follow-up questions. It will turn your answers into a Foundation Plan, ask you to review the
important choices, and show you anything the generated application will leave for later work.

When the Plan looks right, explicitly approve the root transition:

> I approve this Plan and the gaps you showed me. Compile with --output . from this Drawing Board root. I approve
> moving the existing Drawing Board material into design/ while preserving this repository's Git history and remote.
> Inspect and commit the staged generated baseline before setup or source edits. Do not deploy.

The agent runs `bin/firstdraft plan compile --output .`. Tracked Git changes must be clean, and `design/` and the
root-output recovery directory must not already exist. If the CLI refuses, preserve the workspace and ask the agent
to explain the exact reason; do not delete files to force it through.

Root Compile moves the original planning files, including private CLI state and `.env`, into `design/`. It stages
the tracked moves and generated source in the **existing Git repository**; it does not create a second repository.
After inspecting that staged result for credentials, the agent commits it as the untouched generated baseline.
Later First Draft authoring commands run from `design/` through its `bin/firstdraft` wrapper.

If you want a separate private GitHub repository instead, say so before approving the Compile. The agent will use
the distinct Publication mode and give you that repository's URL. This mode requires the **Connect GitHub App** step
from §3. The [optional nested-output path](#optional-keep-the-app-in-application) is also available. No Compile mode
deploys the application.

Codex may ask permission for an exact `bin/firstdraft ...` command to contact `staging.firstdraft.com`. Approve that
command; do not grant unrelated network access.

## 6. Open your app

After the generated baseline is committed, run the generated application's setup from the repository root:

```sh
bin/setup --skip-server
```

Do **not** run `script/initialize-application` or `script/application-smoke` after root Compile, including their
copies under `design/`. They are only for the optional nested application. You can ask:

> Set up and check the generated application, then start it and help me open its preview.

To start it yourself, open a **new terminal** in the Codespace and run:

```sh
cd /workspaces/drawing-board
bin/dev
```

Leave that terminal running. Open the Codespace's **Ports** tab, find port **3000**, and select **Open in Browser**
(the globe icon). Keep the port **Private**. This is your development preview, available while the Codespace and app
are running; it is not a deployed website.

Try a simple action, such as adding a plant. It is normal for parts of your idea to be missing: the agent should
explain what was generated and what remains. You do not need to finish every feature before beginning to use and
change the source. Also check required-field validation and reopen, edit, and delete a sample record.

The generated application includes:

- runnable application source and tests;
- the exact submitted Foundation Plan at `.firstdraft/submitted-foundation-plan.json`; and
- the reviewed list of remaining work at `.firstdraft/gaps.json`.

Before changing anything, open those JSON files and read the generated models, controllers, views, routes,
migrations, and tests. Ask which Rails APIs and established gems the app uses, and whether you would write it this
way by hand. You do not need a separate First Draft web editor.

Run the broader checks against the committed baseline. In the still-running Drawing Board container, start its
existing browser-test service through the relocated helper:

```sh
design/script/selenium start
CI=1 bin/ci
design/script/selenium stop
```

Stop Selenium after the run, including after a failure. Its first image download can take a few minutes. This is
the observed current-container path; do not rebuild the container or add a custom browser service to use it.

If you explicitly chose Publication, open the private repository from the URL the agent provides. Create a
Codespace there and follow its README instead; the original Drawing Board remains a separate planning workspace.

## 7. Make your first change

Return to the **same agent conversation**. It still has the context from planning your app. Choose one small change:

> Change the heading on the plant list to “My indoor jungle.” Update the application source, run the relevant test,
> and help me check the change in the browser.

Then try a change that matters to your idea: a clearer form, a useful field, or the next missing feature. The agent
works directly in the application at the root, using its README and normal Rails tools. Review the diff and save
the feature in a **separate commit**. Run its focused tests and the broader checks above from that clean checkpoint;
record baseline and feature results separately. You can keep editing, testing, and refreshing the preview this way.

You do **not** need another Compile for ordinary development. Compile creates a new starting point; it does not
merge changes into the app you have been editing. Keep the planning files, but do not overwrite your application
to make an edit.

If you close the Codespace, reopen the existing one from [Your codespaces](https://github.com/codespaces), rather
than creating another. Start the app again with `bin/dev` and resume your agent conversation. Stopping a Codespace
preserves its files; deleting it does not.

## 8. Save your app to GitHub

Do this before relying on the Codespace as your only copy:

> Show me this repository's existing GitHub remote. Push the generated-baseline and separate feature commits there,
> without including credentials, and verify that both commits arrived.

Root Compile keeps **one Git history and the same remote**. The repository you created in step 1 now contains the
application and the retained `design/` material. Continue committing and pushing from the application root as you
work. If GitHub requests authorization, use its normal sign-in; do not put tokens in source or chat.

This uses ordinary GitHub tools after direct Compile; it does not require First Draft's optional Publication mode.
Your source is yours to work on with another editor, agent, or developer.

## Optional: keep the app in `application/`

Choose this mode **before** Compile if you want the Drawing Board to remain at the root. Approve
`bin/firstdraft plan compile --output ./application` into an absent directory, then have the agent run these commands
from the Drawing Board root before setup or source edits:

```sh
script/initialize-application application
script/application-smoke
```

The initializer gives `application/` its own initial Git commit. Continue inside that directory with `bin/dev` and
normal Rails commands. The parent Drawing Board ignores it, so pushing the Drawing Board does **not** save the app.
Ask the agent to create and push an approved private application repository before deleting the Codespace.
If `application/` already exists, preserve it and ask the agent how to continue; do not overwrite or delete it to
make room for another Compile. Do not run these nested helpers after root adoption.

## Optional: deploy later

You can deploy after your first small change and keep developing afterward. Deployment gives the app a separate web
address that does not depend on your Codespace being open.

Our initial path is **Render** for the Rails web service and **Neon** for PostgreSQL. The generated application
already includes `DEPLOY.md` and `render.yaml`, its deployment configuration. Start there: the supplied Docker
deployment does not need a new build script. Its initial setup uses PostgreSQL for background jobs and caching too;
you do not need a separate Key Value service unless your app later calls for one.

Ask your agent:

> Help me deploy this application using its DEPLOY.md and render.yaml, with Render and Neon. This first deployment
> will use sample data and free plans. Check the current provider instructions, guide me through account setup, and
> ask before anything billable. Keep secrets out of chat and Git. Then help me test the deployed app and deploy one
> small follow-up change.

The steps you and your agent will follow are:

1. Sign into your own Neon and Render accounts. Create a **free Neon project** in **AWS us-east-2 (Ohio)** to match
   the supplied Render configuration. Use its **direct connection** with connection pooling switched off.
2. Have the agent set `plan: free` on the web service in `render.yaml`, then commit and push the application.
   [Leaving the plan unspecified can select a paid instance](https://render.com/docs/blueprint-spec#plan).
3. In Render, choose **New → Blueprint** and connect the repository containing the application at its root
   (the existing repository after root Compile, or the separate application repository in nested mode).
   Enter the Neon connection string in the prompted `DATABASE_URL` field. Do not paste it into chat or commit it.
   Confirm the proposed web instance is **Free** before creating it.
4. After deployment, open the app's new web address. Have the agent check `/ready`, then create and reopen a sample
   record in the browser. Make one small source change, commit and push it, and check the next deployment too.

[Render's Blueprint guide](https://render.com/docs/infrastructure-as-code) explains the provider steps.
[Free web services](https://render.com/docs/free) sleep when idle and do not preserve local file uploads. Before
sharing an app that stores uploads or sends email, have your agent configure those services too.

## Troubleshooting

Before Compile, if the initial Codespace setup did not finish, run:

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

After root Compile, use the generated application's README and the exact Rails error instead of rerunning Drawing
Board setup or its doctor. The old tooling is under `design/`, and the existing container's PATH still reflects its
pre-Compile layout. If a reconnect says the private-port refresh found an active listener, stop `bin/dev` before
rerunning `design/script/refresh-codespaces-private-port`; do not weaken its listener guard.

If a Codespaces forwarded-port URL reaches Rails' **Blocked hosts** page, stop and tell your agent. Do not disable
Rails host checks; the generated target must own that correction.

Maintaining this template? Read [CONTRIBUTING.md](CONTRIBUTING.md).
