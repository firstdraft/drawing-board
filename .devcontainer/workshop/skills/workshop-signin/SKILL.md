---
name: workshop-signin
description: Sign the workshop attendee in to Render, Neon, Revyl and First Draft from their Codespace, save their Cloudinary key, check their GitHub sign-in and git name and email, and connect Render to GitHub.
disable-model-invocation: true
allowed-tools: Bash(bash ~/.workshop/auth.sh:*), Bash(bash ~/.workshop/login.sh:*), Bash(bash ~/.workshop/git-identity.sh), Bash(bash ~/.workshop/render-workspace.sh:*), Bash(bash ~/.workshop/cloudinary.sh:*), Bash(bash ~/.workshop/neon-key.sh:*), Bash(bash ~/.workshop/open.sh:*)
---

# Workshop sign-in

You are helping a workshop attendee sign in to the tools they will use, from a GitHub Codespace:
VS Code in their browser (sometimes VS Code on their computer), with you running in its terminal.
Most attendees are not technical: one step at a time, plain words, and say what they will see
before they see it. They are already signed in to you and to GitHub.

## Rules

- **Never** ask for, type, or repeat a password, token or API key. Every sign-in happens in the
  attendee's browser, and keys go into private files they paste into themselves. Never read or
  print `~/.workshop/cloudinary.env`, `~/.workshop/cloudinary-key.txt`,
  `~/.workshop/neon-key.txt`, or any credentials file yourself; the helpers handle them.
- **Never** sign out of anything, and never run `gh auth logout`, `render logout`,
  `revyl auth logout`, `firstdraft logout` or similar. Never run `gh auth login`: the Codespace
  already signs GitHub in.
- Use the helper scripts below rather than running sign-in commands yourself: a sign-in command
  run directly waits for the browser, and you would never see its link.
- If the same step fails twice, stop and tell the attendee to raise their hand for the
  instructor. Show them the error.

## Helpers

```
bash ~/.workshop/auth.sh check all          # one [PASS]/[FAIL] line per service
bash ~/.workshop/auth.sh check <service>
bash ~/.workshop/login.sh start <service>   # render | neon | revyl | firstdraft-device | firstdraft
bash ~/.workshop/login.sh stop <service>
bash ~/.workshop/login.sh status <service>  # still waiting, ended, or timed out?
bash ~/.workshop/login.sh wait <service>    # after the approval: let it save, then check
bash ~/.workshop/render-workspace.sh        # after the Render sign-in (step 3)
bash ~/.workshop/cloudinary.sh open|save    # Cloudinary key (step 3)
bash ~/.workshop/neon-key.sh open|save      # Neon API key, only if Neon's browser sign-in fails
bash ~/.workshop/open.sh <link>             # open any page in the attendee's browser
```

`login.sh start` starts the sign-in in the background and returns within about 30 seconds. It
prints one of:

- `URL:` (and sometimes `CODE:`), then `OPENED`, then `WAITING`. The sign-in page opened in a new
  tab of their browser. VS Code may first ask whether to open the external website: they choose
  **Open**. Also show the link as a clickable Markdown link, `[Open the sign-in page](<URL>)`, in
  case the page did not open. If there is a code, show it in **bold** so they can check it
  matches the page. Ask them to approve the sign-in and **tell you when they are done**, then run
  `login.sh wait <service>`: it gives the sign-in a few seconds to save, then prints its check.
- `NOT OPENED`: the browser could not be opened; they click the link instead.
- `EXPIRES`: this sign-in gives up after the stated number of seconds. Ask them to approve
  **right away**.
- `FINISHED`: the command exited by itself, usually because they were already signed in. Run
  `auth.sh check <service>`.
- `NO LINK`: show the output and run `login.sh start <service>` once more.

If `login.sh wait` still ends in `[FAIL]`, run `login.sh status <service>` to see why. `WAITING`
means the approval has not reached the sign-in yet: ask whether they finished approving, then run
`login.sh wait <service>` again. Only after `ENDED` or `TIMED OUT`, run `login.sh start <service>`
again: each start makes a **new** link, and older links stop working, so only ever give them the
newest one.

`open.sh` prints `OPENED` or `NOT OPENED` the same way: also show the link as a clickable
Markdown link.

## Steps

Start with `bash ~/.workshop/auth.sh check all`. Tell the attendee which sign-ins are left, then
do only the [FAIL] ones, in this order.

### 1. GitHub (`github`)

The Codespace is already signed in to GitHub with the account that created it. If this check
fails, get the instructor; do not start a GitHub sign-in.

### 2. Git name and email (`git-identity`)

The Codespace normally sets these from the GitHub account. If the check fails, run
`bash ~/.workshop/git-identity.sh` without asking. It uses the account's name (or username) and
its private GitHub no-reply address. Tell them, in a sentence, the name and address it set.

### 3. Render (`render`), Neon (`neon`), Cloudinary (`cloudinary`), Revyl (`revyl`)

One at a time: `login.sh start <service>`, they approve in the browser, you check (Cloudinary
works differently; see below). Before each, say in a sentence what the service is for:

- **Render** hosts their app on the internet.
- **Neon** provides the app's database (a free PostgreSQL database).
- **Cloudinary** stores the photos and files people upload to their app.
- **Revyl** lets them try their iPhone and Android app on a phone shown in their browser.

If they do not have an account, they can create one on the sign-in page (signing up with GitHub
is the quickest).

**Right after Render's sign-in passes**, before Neon:
1. **Workspace (`render-workspace`).** Run `bash ~/.workshop/render-workspace.sh`. It keeps a
   workspace that is already set, or sets the account's only one. If it prints `ASK:`, the account
   has several: show them the names, ask which one to use, and run it again with that workspace's
   ID.
2. **Render on GitHub** (no check). Render needs permission to read the code they will put on
   GitHub later. Run `bash ~/.workshop/open.sh https://github.com/apps/render/installations/new`.
   On that GitHub page they choose their own account, choose **All repositories** (their app's
   repository does not exist yet), and click **Install**. If GitHub sends them on to Render and
   asks them to sign in or confirm, they do. Ask them to tell you when they are done. If GitHub
   shows Render is already installed, there is nothing to do. Since nothing can check this step,
   do it whenever you did the Render sign-in; otherwise ask whether they already installed Render
   on GitHub.

**Neon needs its account ready first.** Neon's sign-in gives up 60 seconds after it starts, which
is not enough time to create an account. So before `login.sh start neon`:
1. Run `bash ~/.workshop/open.sh https://console.neon.tech/signup` and ask them to sign up (or
   sign in, if they already have an account), using **Continue with GitHub**, which is quickest.
   They should finish any welcome screens until they see the Neon console, then tell you.
2. Only then run `login.sh start neon`. They click to approve straight away.
3. After approving, Neon sends their browser to a page on `127.0.0.1`. Ask what that page shows,
   and run `login.sh wait neon`. In VS Code on their computer, the page says they are signed in
   and the check passes. In a browser tab, the page usually cannot be reached ("This site can't be
   reached"); that is expected here, and the check fails. If the page was reachable but
   `login.sh status neon` says `TIMED OUT`, they took over a minute: start it again once and ask
   them to approve straight away. If the page could not be reached, run `login.sh stop neon` and
   use an API key instead:
   1. Run `bash ~/.workshop/open.sh https://console.neon.tech`. In the Neon console they open
      **Account settings** from their account menu, then **API keys**, click **Create new API
      key** (a personal key; any name, such as `workshop`), and copy the key. Neon shows it only
      once.
   2. Run `bash ~/.workshop/neon-key.sh open`. It opens a private file in the editor. They paste
      the key after `NEON_API_KEY=` and save the file (Ctrl+S, or Cmd+S on a Mac), then tell you.
   3. Run `bash ~/.workshop/neon-key.sh save` and follow what it prints (`NEXT:` or `INVALID:`:
      pass on what it says and run `save` again after they fix the file). On `SAVED:`, run
      `auth.sh check neon`.

**Cloudinary has no sign-in command.** Their app needs Cloudinary's key, which they copy from
Cloudinary's website into a private file in the editor, in three pieces. Never ask them to paste
anything into this chat.
1. Run `bash ~/.workshop/open.sh https://cloudinary.com/users/register_free`. They choose **Sign
   up with GitHub** (or Google), which is quickest, or sign in if they already have an account.
   They answer or skip any welcome questions until they see the Cloudinary console, then tell
   you.
2. Run `bash ~/.workshop/open.sh https://console.cloudinary.com/app/settings/api-keys` (the **API
   Keys** page, also under Settings), then `bash ~/.workshop/cloudinary.sh open`. It opens a
   private file in the editor with three lines to fill in: `CLOUD_NAME=` (shown at the top of the
   page; copying the whole **API environment variable** also works), `API_KEY=` and
   `API_SECRET=` from the same row of the list of keys. Before showing the API Secret, Cloudinary
   may ask them to confirm it is them (their password or a code it emails them); they do that
   themselves. They paste each value after its `=`, save the file, and tell you.
3. Run `bash ~/.workshop/cloudinary.sh save` and follow what it prints:
   - `NEXT:` or `INVALID:` pass on what it says, and run `save` again after they fix the file.
   - `SAVED:` run `auth.sh check cloudinary`.

**Revyl needs its account ready first, open in their browser.** Revyl's sign-in gives up after a
few minutes, and later the link to try their app on a phone only opens in a browser signed in to
Revyl with the same account. So before `login.sh start revyl`:
1. Ask whether they already have a Revyl account (some make one before the workshop).
   - **No account:** run `bash ~/.workshop/open.sh https://app.revyl.ai/signup`. They choose
     **Continue with GitHub**. When Revyl asks them to choose an organization, they **create a new
     one** of their own. They should not join an existing organization, even a friend's or their
     company's: they would share its phones and its free monthly time.
   - **Already have one:** run `bash ~/.workshop/open.sh https://app.revyl.ai`. If it shows the
     sign-in page, they sign in the way they signed up (for example with GitHub).
2. Ask them to tell you when they see their Revyl dashboard. That browser is the one where the
   phone preview opens later.
3. Only then run `login.sh start revyl`; they approve in that same browser.

If Revyl's sign-up page shows an error or a security check, have them raise their hand: the
instructor may move them to a phone hotspot.

Once the check passes, tell them in a few sentences how the phone preview works later: the link
opens a phone in this browser; one phone runs at a time, and they ask you to stop it when they
are done looking. If Revyl says "Concurrency limit reached", the last phone is still shutting
down: wait 15 to 30 seconds, then ask you to stop it again (or stop it on the Revyl dashboard
under Sessions). The free plan is enough, so they ignore any offer to upgrade.

### 4. First Draft (`firstdraft`)

First Draft is what they will use to plan and build their app in this workshop. It is in
pre-alpha, so its pages are behind a username and password that the attendee has on their
workshop handout. Before you start the sign-in, tell them what they will see:

1. Their browser asks for a username and password: this is the **First Draft pre-alpha** sign-in
   (the box itself usually just says "Sign in" and firstdraft.com). They type the username and
   password from their handout themselves. **Never** ask for, type, or repeat them. If they have
   no handout, or it is refused, get the instructor.
2. GitHub may ask them to sign in to First Draft: they approve.
3. First Draft asking them to approve the sign-in for this Codespace: they approve, then tell
   you.

Then run `login.sh start firstdraft-device` and check, as above. The link includes the code, so
they only approve; if the page asks for the code, it is the `CODE:`.

If `login.sh wait firstdraft-device` still fails after they approved, follow the retry steps above
and start it once more. Do not use `login.sh start firstdraft` in a browser tab: its approval returns to
`127.0.0.1`, which only VS Code on their computer can reach. If it fails twice, get the
instructor.

## Finishing

Run `bash ~/.workshop/auth.sh check all`. When every line shows [PASS], tell the attendee:

> You're all signed in! To start building, type `/clear` for a fresh conversation (in Codex,
> `/new`). Then follow **Part 3** of the workshop instructions.
