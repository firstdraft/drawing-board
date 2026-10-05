# First Draft workshop in a Codespace

Use this if you cannot install programs on your laptop. Everything happens in a GitHub Codespace: VS Code in your
browser, with every tool already installed. You type a request to Claude in its terminal, and Claude does the work.
Plan on:

- **Setting up your Codespace:** about 5 minutes.
- **Signing in to your accounts:** about 20 minutes.
- **Building, launching and previewing your first app:** about 45 minutes.

You need a personal GitHub account and a Claude account that includes Claude Code. To use Codex instead, see
[Using Codex](#using-codex).

## Part 1: Set up your Codespace

1. Sign in to GitHub, open [firstdraft/drawing-board](https://github.com/firstdraft/drawing-board), and choose
   **Use this template** &rarr; **Open in a codespace**.
2. If VS Code asks, choose **Trust Folder & Continue**. Wait until the terminal at the bottom says
   `Drawing Board setup complete.`
3. Click in the terminal (if it shows no `$` prompt, open a new one from the &#9776; menu: **Terminal** &rarr; **New
   Terminal**), type `claude` and press Enter. Sign in with your Claude account: open the link it shows, approve,
   and if the browser shows a code, paste it into the terminal. If pasting does nothing, press `Ctrl+C`, run
   `claude auth login`, and then `claude` again.

## Part 2: Sign in to your accounts

Have your workshop handout ready: First Draft asks for the workshop username and password from it.

4. Type `/workshop-signin` and press Enter. Claude opens each sign-in page in a new browser tab and shows you any
   code. If VS Code asks whether to open the website, choose **Open**. Approve each one and tell Claude when you are
   done, until every account is signed in. GitHub is already signed in.
   - For Cloudinary, which stores your app's photos, Claude opens a private file in the editor. You copy three
     values from Cloudinary's website into it and save it; Claude saves them without showing them.
   - For Neon, if the page after you approve says "This site can't be reached", tell Claude. You then make a Neon
     API key and paste it into a private file the same way.

## Part 3: Build your first app

5. Type `/clear` for a fresh conversation, then type:
   ```text
   /create-full-stack-app Help me build a social network for just my family. It should work and look like Instagram so that it's familiar.
   ```
6. Claude first looks up how similar apps work, then asks a few questions, one at a time. One of them is how
   involved you want to be in technical decisions. Answer in your own words, or say "you pick". At any point you can
   say "make the rest of the decisions for me".
7. A few minutes in, Claude tells you what First Draft will and won't build. Then it shows you a summary of the
   plan. Change anything you like: it's your app. When it looks right, approve it. Building takes about a minute.
8. Start the web app:
   ```text
   Start the web app.
   ```
   Claude opens your app in a new browser tab. If your app has sign-in, use the demo login Claude shows you. Try
   posting a photo, liking a post, and following someone.
9. Save your work to GitHub:
   ```text
   Commit the app and push it to a new private repository on my GitHub account. Give me the link.
   ```
   Pushing also starts GitHub building your iPhone and Android apps. That takes about five minutes, so carry on.
10. Put your app on the internet:
    ```text
    Deploy this app to Render's free plan with a Neon database. Give me the link when it's live.
    ```
    The first deploy takes a few minutes. Your live app starts with no data: the sample data is only in your
    Codespace. Sign up on the live app to try it: you are signed in right away. "Forgot password" emails are not
    sent until an email provider is set up.
11. Try your app on a phone, in your browser:
    ```text
    Show me the Android app in Revyl.
    ```
    Then:
    ```text
    Now show me the iPhone app.
    ```
    The link opens a phone in your browser. If Revyl asks you to sign in, use the same account as before. Inside
    your app, sign in with the same demo login as in your Codespace. While the phone preview runs, your Codespace's
    web app is public so the phone can reach it; Claude makes it private again when you are done.
12. Make it yours. Ask for one change at a time, then try it in your Codespace. Some ideas:
    ```text
    Limit posts to 280 characters.
    ```
    ```text
    Limit how many people someone can follow to 50.
    ```
    ```text
    Only allow sign-ups from @YOURFAMILY.com email addresses.
    ```
    When you like a change, say `Commit and push.` Render updates the live app a minute or two later.

## Part 4: Start over with your own idea

Each Codespace holds one app and saves it to one GitHub repository, so your own idea gets a new Codespace.

13. Repeat Part 1 to open a new Codespace from [firstdraft/drawing-board](https://github.com/firstdraft/drawing-board).
14. Type `/workshop-signin` again. Your accounts already exist, so each sign-in only needs your approval. Paste your
    Cloudinary values (and Neon key, if you made one) again: each Codespace keeps its own copy.
15. Describe your idea:
    ```text
    /create-full-stack-app A place for my book club to pick the next book and vote on meeting dates.
    ```

## If something goes wrong

- **The page stopped loading:** type `Restart the web app.`
- **Claude seems stuck:** press `Esc`, then type `continue`.
- **Building seems stuck for more than five minutes:** type `Cancel the stuck compile and try again.`
- **Claude asks you to approve something:** it checks before risky steps, such as deploying. Approve it if it is
  what you asked for.
- **The Codespace stopped or you closed its tab:** open [your codespaces](https://github.com/codespaces) and choose
  the same one, not a new one. In its terminal, type `claude --continue` to pick up where you left off.
- **The same step fails twice:** raise your hand, and leave the error on screen for the instructor.

## After the workshop

- To come back to a project, open [your codespaces](https://github.com/codespaces), choose its Codespace, and type
  `claude --continue` in the terminal. Your sign-ins stay while the Codespace exists.
- A Codespace stops after 30 minutes without use, and GitHub deletes a stopped Codespace after 30 days. Your app
  is safe on GitHub once you have pushed it. Delete Codespaces you no longer need: free GitHub accounts include a
  limited amount of Codespaces use each month.
- Render's free plan sleeps when nobody visits, so the first visit afterwards takes about a minute.
- To remove an app from the internet, ask Claude: `Delete this app's Render service and its Neon project.`

## Using Codex

Codex is also installed. In step 3, run `codex login --device-auth`: open the link it shows, sign in to ChatGPT,
and enter the code from the terminal. Then run `codex`. Type `$workshop-signin` instead of `/workshop-signin`,
`/new` instead of `/clear`, and `$firstdraft:create-full-stack-app` instead of `/create-full-stack-app`. Everything
else is the same; to pick up later, run `codex resume`.

Maintaining this template? Read the [maintainer guide](https://github.com/firstdraft/dockerfiles/blob/main/drawing-board/README.md).
