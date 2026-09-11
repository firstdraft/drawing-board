# Build an app with First Draft

This repository is a workspace for building an app with Claude or Codex. Describe your idea, review the plan with
your agent, and First Draft generates a Rails starting point at this repository's root. The original Drawing Board
files move into `design/`; your Git history and any existing remote stay in place. Save the generated baseline to
your own private GitHub repository, then keep working with the same agent to make it your own.

You do not need to install programming tools on your computer. The GitHub Codespace created from this template
contains everything the agent needs.

The path is: **describe → review → generate → save → open → inspect → change**. You stay in the same Codespace throughout.
First Draft is an internal alpha: use test projects and sample data. The generated app is a head start, not a
finished product. Sharing code is enough for this test; deployment is optional.

## Before you start

You will need:

- a personal GitHub account;
- access to <https://staging.firstdraft.com>; and
- a Claude account with Claude Code access, or a ChatGPT account with Codex access.

Use the same personal GitHub account to create the Codespace and sign in to First Draft.

## 1. Create your Drawing Board

1. Open [firstdraft/drawing-board](https://github.com/firstdraft/drawing-board).
2. Select **Use this template**, then **Open in a codespace**.

Your Drawing Board opens in VS Code in the browser, with local Git history but no GitHub remote. You can describe
and compile your app before choosing a repository name. In [step 6](#6-save-your-app-to-github), you will publish
the generated baseline to your own private repository. This launch can use the template's prebuilt environment.
This is GitHub's supported
[template Codespace workflow](https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-from-a-template).

If you need an organization-owned repository or a remote before starting, choose **Use this template → Create a new
repository** instead. Select the intended owner, give it a name, choose **Private**, and create it. In that new
repository, select **Code → Codespaces → Create codespace on main**. Follow the same guide; at step 6, push to that
existing repository.

## 2. Wait for workspace setup

If VS Code asks, select **Trust Folder & Continue** for this Drawing Board. Leave the browser tab open until the
terminal says `Drawing Board setup complete.`

Setup installs the pinned agents, First Draft CLI, and First Draft Skill, and prepares your local configuration.
GitHub can reuse the template's prebuilt environment to shorten startup. If a prebuild is unavailable, the first
start may take a few minutes.
The workspace starts its database automatically. Browser tests start their browser service only when they need it,
so the first browser-test run may take a little longer while that service downloads.

## 3. Sign in to First Draft

1. Open <https://staging.firstdraft.com> in another browser tab.
2. Select **Sign in with GitHub**.
3. Leave that browser tab open so you can create the token in the next step.

This sign-in is enough for the ordinary in-workspace path. If you want First Draft's separate Publication mode to
create the application's private GitHub repository instead of compiling in this Codespace, also select **Connect
GitHub App** and follow GitHub's prompts. **Only select repositories** is sufficient; GitHub automatically gives the
App access to repositories it creates.

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

These are instructions for the terminal inside this prepared Codespace. For a blank local folder or a different
project, start with the [First Draft Skills repository](https://github.com/firstdraft/skills); installing a Skill
alone does not create Drawing Board's workspace, tools, or `.env` setup.

For Claude, run this and follow its sign-in prompts:

```sh
claude
```

Use the account that already has Claude Code access. If the browser does not open, click the printed login URL, or
select the full URL and open it in your browser. You can also press `c` at the login prompt to copy the URL. If the
browser shows a login code, paste it into the terminal's `Paste code here if prompted` field, not into chat. Wait
for the terminal to confirm the login.

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

For device sign-in, leave the terminal waiting, open the address it prints in your browser, sign in to your ChatGPT
account, and enter that terminal's one-time code. Wait for the terminal to confirm login before starting `codex`.
If the code expires or login is interrupted, rerun `codex login --device-auth` from the shell and use its new code.
If device login is unavailable, enable it in your ChatGPT security settings, or ask your ChatGPT workspace admin to
enable it. See [OpenAI's remote sign-in guide](https://learn.chatgpt.com/docs/auth#login-on-headless-devices).

At the shell, `codex login status` checks for a saved login. Agent sign-in is separate from the First Draft token in
step 4; do not paste either credential into chat or copy credentials between machines. You do not need to sign in
again for every Compile. To continue an existing conversation, use `codex resume` from the same workspace root and
select that conversation; running `codex` starts a new one.

Codex may ask permission for an exact `bin/firstdraft ...` command to contact `staging.firstdraft.com`, including
during Plan submission before Compile. Review and approve that command when it matches the work you requested;
Codex can then continue the operation. This [sandbox approval](https://learn.chatgpt.com/docs/agent-approvals-security#sandbox-and-approvals)
does not require another login or broader network access. If authentication needed fixing, return to the same
conversation and tell the agent it is ready so it can continue the existing Plan.

Then describe the app in ordinary language. For example:

> Make me an app that helps me keep track of the plants in my home.

Both agents should use the installed First Draft Skill for this request. To select it explicitly in Codex, enter
`/skills` and choose `firstdraft:create-full-stack-app`, or start your message with
`$firstdraft:create-full-stack-app`. Then describe your idea. See
[Codex's Skill instructions](https://learn.chatgpt.com/docs/build-skills#how-chatgpt-and-codex-use-skills).

Answer the agent's follow-up questions. It will turn your answers into a Foundation Plan, ask you to review the
important choices, and show you anything the generated application will leave for later work.

When the Plan looks right, explicitly approve the root transition:

> I approve this Plan and the gaps you showed me. Compile with --output . from this Drawing Board root. I approve
> moving the existing Drawing Board material into design/ while preserving this repository's Git history and any
> existing remote. Inspect the staged result for credentials and commit the generated baseline before setup or source
> edits. Then help me save it to my own private GitHub repository using step 6 below. Do not deploy.

The agent runs `bin/firstdraft plan compile --output .`. Tracked Git changes must be clean, and `design/` and the
root-output recovery directory must not already exist. If the CLI refuses, preserve the workspace and ask the agent
to explain the exact reason; do not delete files to force it through.

Root Compile moves the original planning files, including private CLI state and `.env`, into `design/`. It stages
the tracked moves and generated source in the **existing Git repository**; it does not create a second repository.
After inspecting that staged result for credentials, the agent commits it as the untouched generated baseline.
An `origin` remote is not required for this Compile; any existing remote is preserved.
The root `bin/` now belongs to the generated app, so bare `firstdraft` no longer runs the wrapper that loads `.env`
and requires staging. For later First Draft authoring commands, change into `design/` and use `bin/firstdraft`.

If you want First Draft to compile and create a separate private GitHub repository, say **Compile and publish
through First Draft** before approving the Compile. The agent will use that distinct mode and give you the
repository's URL. It does not save this Codespace's commits. This mode requires the **Connect GitHub App** step from
§3. The [optional nested-output path](#optional-keep-the-app-in-application) is also available. No Compile mode
deploys the application.

## 6. Save your app to GitHub

**Save the generated baseline now, before setup, preview, or your first feature.** Until you publish it, the
Codespace is your only copy. Stopping preserves its files; deleting it, including through
[automatic expiry](https://docs.github.com/en/codespaces/setting-your-user-preferences/configuring-automatic-deletion-of-your-codespaces),
removes them even if you made local commits.

1. Have the agent confirm that the generated baseline is committed and contains no credentials. Keep `design/.env`
   and the private planning state ignored.
2. In VS Code, open **Source Control** in the left sidebar. Select **Publish to GitHub**; depending on the editor,
   this button may say **Publish Branch**.
3. Enter your app's repository name and select **Publish to GitHub private repository**. The new repository belongs
   to the personal GitHub account that created the Codespace.
4. Select **Open on GitHub**. Verify that the repository is **Private** and that the generated-baseline commit,
   application source, and retained `design/` material arrived before continuing.

Publish **inside VS Code** so it adds the new remote and pushes your commits. Publishing through the separate
“Your codespaces” page leaves the existing Codespace unlinked. See
[VS Code's publishing guide](https://code.visualstudio.com/docs/sourcecontrol/repos-remotes#publish-to-github) and
[GitHub's template publishing instructions](https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-from-a-template#publishing-to-a-repository-on-github).

Your agent can also [publish from the Codespace terminal](CONTRIBUTING.md#publish-from-the-codespace-terminal)
after you approve the private repository's name. Ask it to **Create GitHub repository** to save the existing
workspace privately; this uses the Codespace's existing GitHub credential and does not Compile again.

If you created a repository before opening the Codespace, use its existing remote instead of creating another:

> Show me the intended GitHub repository for this workspace. Confirm the generated baseline contains no
> credentials, push that commit to the existing remote, and verify it arrived.

Root Compile keeps **one Git history**. Publishing adds its first remote, or an existing remote stays in place.
Continue committing and pushing from the application root as you work. If GitHub requests authorization, use its
normal sign-in; do not put tokens in source or chat. This uses ordinary GitHub tools and does not require First
Draft's optional Publication mode.

## 7. Open your app

After the generated baseline is saved on GitHub, run the generated application's setup from the repository root:

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

## 8. Make your first change

Return to the **same agent conversation**. It still has the context from planning your app. Choose one small change:

> Change the heading on the plant list to “My indoor jungle.” Update the application source, run the relevant test,
> and help me check the change in the browser.

Then try a change that matters to your idea: a clearer form, a useful field, or the next missing feature. The agent
works directly in the application at the root, using its README and normal Rails tools. Review the diff and save
the feature in a **separate commit**. Run its focused tests and the broader checks above from that clean checkpoint;
record baseline and feature results separately. Push the tested feature commit to the same repository and verify
that it arrived. You can keep editing, testing, and refreshing the preview this way.

You do **not** need another Compile for ordinary development. Compile creates a new starting point; it does not
merge changes into the app you have been editing. Keep the planning files, but do not overwrite your application
to make an edit.

If you close the Codespace, reopen the existing one from [Your codespaces](https://github.com/codespaces), rather
than creating another. Start the app again with `bin/dev` in one terminal. In another terminal at the application
root, resume your original agent conversation; for Codex, run `codex resume` and select it. Keep ordinary source
edits at the application root after Compile; `design/` is only for later First Draft authoring work. See
[Codex's resume command](https://learn.chatgpt.com/docs/developer-commands#codex-resume).
Stopping a Codespace preserves its files; deleting it does not.

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

If the doctor reports that an agent, CLI, or Skill is unavailable or mismatched, run `.devcontainer/setup-agents`
again; it is safe to repeat. If that still fails, use **Codespaces: Rebuild Container**.

If a First Draft command reports a token, API origin, or `.env` problem, run:

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
