# Build an app with First Draft

This repository is a workspace for building an app with Claude or Codex. Describe your idea, review the plan with
your agent, and First Draft generates a Rails starting point in the `application` folder. Keep working with the same
agent to make it your own.

You do not need to install programming tools on your computer. The GitHub Codespace created from this template
contains everything the agent needs.

The path is: **describe → review → generate → open → change → share**. You stay in the same Codespace throughout.
First Draft is an internal alpha: use test projects and sample data. The generated app is a head start, not a
finished product.

## Before you start

You will need:

- a personal GitHub account;
- access to <https://staging.firstdraft.com>; and
- a Claude or Codex account.

Use the same personal GitHub account for the Drawing Board, Codespace, and First Draft sign-in.

## 1. Create your Drawing Board

1. Open [firstdraft/drawing-board](https://github.com/firstdraft/drawing-board).
2. Select **Use this template**, then **Create a new repository**.
3. Give the repository a name for your app idea and select **Create repository**.

This repository is your Drawing Board. The generated application will appear later in its ignored `application`
folder, separate from the Drawing Board source.

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

When the Plan looks right, approve the in-workspace Compile. First Draft will put the generated application in
`application`, and the agent will initialize and verify it before continuing there.

If you want a separate private GitHub repository instead, say so before approving the Compile. The agent will use
the distinct Publication mode and give you that repository's URL. This mode requires the **Connect GitHub App** step
from §3. Neither mode deploys the application.

Codex may ask permission for an exact `bin/firstdraft ...` command to contact `staging.firstdraft.com`. Approve that
command; do not grant unrelated network access.

## 6. Open your app

For the ordinary in-workspace path, the agent runs these Drawing Board commands after Compile:

```sh
script/initialize-application application
script/application-smoke
```

The first command saves the untouched generated source as its own initial Git version. The second sets up and checks
the app. You can ask:

> Set up and check the generated application, then start it and help me open its preview.

To start it yourself, open a **new terminal** in the Codespace and run:

```sh
cd /workspaces/drawing-board/application
bin/dev
```

Leave that terminal running. Open the Codespace's **Ports** tab, find port **3000**, and select **Open in Browser**
(the globe icon). Keep the port **Private**. This is your development preview, available while the Codespace and app
are running; it is not the deployed app you will share later.

Try a simple action, such as adding a plant. It is normal for parts of your idea to be missing: the agent should
explain what was generated and what remains. You do not need to finish every feature before beginning to use and
change the source.

The generated application includes:

- runnable application source and tests;
- the exact submitted Foundation Plan at `.firstdraft/submitted-foundation-plan.json`; and
- the reviewed list of remaining work at `.firstdraft/gaps.json`.

You can open either JSON file in the editor to inspect it. You do not need a separate First Draft web editor.

If you explicitly chose Publication, open the private repository from the URL the agent provides. Create a
Codespace there and follow its README instead; the original Drawing Board remains a separate planning workspace.

## 7. Make your first change

Return to the **same agent conversation**. It still has the context from planning your app. Choose one small change:

> Change the heading on the plant list to “My indoor jungle.” Update the application source, run the relevant test,
> and help me check the change in the browser.

Then try a change that matters to your idea: a clearer form, a useful field, or the next missing feature. The agent
works directly in `application`, using its README and normal Rails tools. You can keep editing, testing, and
refreshing the preview this way.

You do **not** need another Compile for ordinary development. Compile creates a new starting point; it does not
merge changes into the app you have been editing. Keep the planning files, but do not overwrite your application
to make an edit.

If you close the Codespace, reopen the existing one from [Your codespaces](https://github.com/codespaces), rather
than creating another. Start the app again with `bin/dev` and resume your agent conversation. Stopping a Codespace
preserves its files; deleting it does not.

## 8. Save your app to GitHub

Do this before relying on the Codespace as your only copy:

> Help me save the application to its own private GitHub repository. Show me the account and repository name before
> creating it. Commit the application changes and push them, without including credentials.

The `application` folder has its **own** Git history, separate from the Drawing Board. Pushing the Drawing Board does
not save the application. Ask the agent to show you the application repository's URL and verify that your changes
are there. Continue committing and pushing from `application` as you work.

This uses ordinary GitHub tools after direct Compile; it does not require First Draft's optional Publication mode.
Your source is yours to work on with another editor, agent, or developer.

## 9. Deploy when you want to share

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
3. In Render, choose **New → Blueprint** and connect the **application repository**, not the Drawing Board repository.
   Enter the Neon connection string in the prompted `DATABASE_URL` field. Do not paste it into chat or commit it.
   Confirm the proposed web instance is **Free** before creating it.
4. After deployment, open the app's new web address. Have the agent check `/ready`, then create and reopen a sample
   record in the browser. Make one small source change, commit and push it, and check the next deployment too.

[Render's Blueprint guide](https://render.com/docs/infrastructure-as-code) explains the provider steps.
[Free web services](https://render.com/docs/free) sleep when idle and do not preserve local file uploads. Before
sharing an app that stores uploads or sends email, have your agent configure those services too.

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

If a Codespaces forwarded-port URL reaches Rails' **Blocked hosts** page, stop and tell your agent. Do not disable
Rails host checks; the generated target must own that correction.

Maintaining this template? Read [CONTRIBUTING.md](CONTRIBUTING.md).
