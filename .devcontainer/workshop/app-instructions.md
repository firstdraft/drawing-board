# Workshop apps in this Codespace

Added by the Drawing Board. Where these notes differ from an app's own guides or a provider's
guidance, follow these notes. Never print secrets, show a file that holds one, or ask the user to
paste one into the chat.

## Files the user wants to use
- The user adds files, such as a design zip, by dragging them into VS Code's file list. Unzip a
  design into the project folder before the first Compile. Compiling into the current folder keeps
  it under `.firstdraft/design/`.

## Web app
- Start the web app in the background and keep it running all session:
  `bin/dev </dev/null >log/bin-dev.log 2>&1`. Rails already admits this Codespace's forwarded
  address. Open `https://$CODESPACE_NAME-3000.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN` for the
  user with `bash ~/.workshop/open.sh <URL>`, and also give them that link. Keep port 3000
  **private** for this; the user's own browser is signed in to GitHub and can open it.
- To restart the web app, including after the Codespace was stopped and reopened: stop it if it is
  running, wait until `ss -H -ltn 'sport = :3000'` prints nothing, then refresh port 3000 from
  `/workspaces/drawing-board` with `.firstdraft/design/script/refresh-codespaces-private-port`
  (`script/refresh-codespaces-private-port` if the app is in `application/`), and start it as
  above. Without the refresh, the private address of a reopened Codespace can answer 502 while
  the app runs. The script keeps the port private and refuses while anything listens on 3000.
- Do not run `bin/ci` while the web app is running: its setup step reinstalls JavaScript packages
  and stops the JavaScript watcher. Stop the web app, run `bin/ci`, then start the web app again
  as above.

## Saving to GitHub
- The Codespace's built-in GitHub sign-in cannot run `gh repo create`. To save an unpublished
  Codespace to a new private repository, confirm the name, then run
  `gh api --method POST "/user/codespaces/$CODESPACE_NAME/publish" -f name=<name> -F private=true --jq '.repository | {full_name, private, html_url}'`,
  check `private: true`, then `git remote add origin https://github.com/<owner>/<name>.git` and
  `git push -u origin HEAD`. A Codespace can create only one repository this way; if it already
  has a remote, push there.

## Photo and file uploads (Cloudinary)
- An app with uploads (`config/initializers/cloudinary.rb` exists) needs `CLOUDINARY_URL`. The
  sign-in saved the user's key in `~/.workshop/cloudinary.env`. Never print it, show a file that
  holds it, or ask the user for it.
- Before starting such an app's web app, run `bash ~/.workshop/cloudinary.sh install .`. It writes
  the key into `.env.development.local` without printing it; restart the web app if it was
  already running. If it prints `MISSING`, the user runs `/workshop-signin` (it redoes only what
  is missing), then run it again.
- An upload failing with `KeyError: key not found: "CLOUDINARY_URL"` means the key is missing:
  locally, run the install above; on Render, the service was created without it, so delete it and
  create it again with the recipe, reusing the same Neon project.

## iPhone and Android preview
- Preview both with Revyl. GitHub builds the app from the pushed commit: do not install Xcode, a
  JDK, the Android SDK or an Emulator, and skip the guides' Emulator, tunnel and Mac steps.
- Use the guides' Codespace route instead of a tunnel: with the web app running, make port 3000
  public with `gh codespace ports visibility 3000:public -c "$CODESPACE_NAME"`. The address is
  `https://$CODESPACE_NAME-3000.$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN`. Check that
  `<URL>/up` returns 200. Tell the user the web app is public while the phone preview runs.
- Commit and push (with `git push -u` if the helper asks for an upstream), then run
  `bin/android preview revyl --server <URL>` (or `bin/ios ...`) and give the user the printed
  Viewer link.
- Tell the user to open the Viewer link in the browser already signed in to revyl.ai with the
  same Revyl account as the CLI (`revyl auth status` shows it). If Revyl asks them to sign in,
  they sign in with that account.
- If the user has no Revyl account yet, they sign up at `https://app.revyl.ai/signup` with
  Continue with GitHub and create their own organization (never join someone else's), then sign
  the CLI in with `/workshop-signin`.
- One Revyl device at a time, and stop it as soon as the user is done looking:
  `bin/<platform> preview revyl stop`. Stop output with `"stop_requested": true` and
  `"stopped": false` is normal: the device takes about 15 seconds to shut down. Wait until
  `revyl device list --json` prints `[]` before starting another device; the helper refuses while
  one is listed. An `"error"` key or a non-zero exit means the stop failed: run it again.
- When the user is done with phone previews, make port 3000 private again:
  `gh codespace ports visibility 3000:private -c "$CODESPACE_NAME"`.
- "Concurrency limit reached" means the previous device is still shutting down. Wait 15-30
  seconds, run the stop again (or have the user stop it on the Revyl dashboard under Sessions),
  then retry. Ignore any upgrade hint: the free plan is enough. Never suggest a paid plan or
  adding a card.
- If GitHub refuses the build dispatch with HTTP 403, the user opens the repository's
  **Actions** tab, runs the platform's artifact workflow on their branch, and you rerun the
  preview.
- If Android shows "Update Required", stop the device and tell the user. Never sign in to Google
  Play.

## Deploying to Render
- Follow the "Deploy from the command line" section of the app's `DEPLOY.md`, with these
  additions:
- Each app gets its own Render workspace, because Render's 750 free instance hours a month are
  per workspace and running out suspends every free web service in it. The Render CLI cannot
  create a workspace, so before an app's first deploy, run
  `bash ~/.workshop/open.sh https://dashboard.render.com` (also give them the printed link) and
  have the user create one: the workspace switcher, then **New workspace**, the **Hobby** plan (no
  monthly fee), named after the app. Then run `render workspaces -o json --confirm` and
  `render workspace set <ID> --confirm` with its ID. The sign-in's workspace only makes the CLI
  work. Before later `render` commands for an app, set its workspace again if another app's is
  active.
- Run `neonctl` only after `bash ~/.workshop/auth.sh check neon` passes: signed out, it starts a
  browser sign-in that cannot finish here. If it fails, the user runs `/workshop-signin`.
- Never use `npx get-db`, `neon-new`, neon.new, `neon claim` or any other claimable or no-account
  database: they run PostgreSQL 17, and the deploy fails with `function uuidv7() does not exist`.
  Use the new Neon project on PostgreSQL 18 that `DEPLOY.md` creates, and its direct connection
  string, not pooled, even where Neon guidance advises pooled.
- Pass `--confirm` to every `render` command, and `-o json` when you read its output; without
  them it can wait for input forever. List services with `render services list -o json --confirm`.
- Keep the database URL, `SECRET_KEY_BASE` and `CLOUDINARY_URL` in shell variables, as `DEPLOY.md`
  does, and never print them. For an app with uploads, skip `DEPLOY.md`'s `read -rs
  CLOUDINARY_URL`: start the same one command with `. ~/.workshop/cloudinary.env &&`, which sets
  the variable for `--env-var "CLOUDINARY_URL=$CLOUDINARY_URL"`.
- If Render cannot reach the GitHub repository, the user adds it to Render's GitHub app:
  `bash ~/.workshop/open.sh https://github.com/apps/render/installations/new`. A new workspace may
  need its own GitHub connection: if Render still cannot see the repository, they connect GitHub
  in that workspace's settings on the Render dashboard.
- Give the user the live URL when the newest deploy is `live`. The deployed app starts empty:
  sample records are for development only.
