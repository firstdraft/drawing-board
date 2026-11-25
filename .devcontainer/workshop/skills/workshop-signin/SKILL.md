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
- If the same step fails twice, stop that step. Show them the error, explain it in a sentence,
  and go on to the next sign-in. Tell them they can run `/workshop-signin` (in Codex,
  `$workshop-signin`) again later: it redoes only what is missing. They may be working on their
  own, so never tell them to ask someone for help.

## Helpers

```
bash ~/.workshop/auth.sh check all          # one [PASS]/[FAIL] line per service
bash ~/.workshop/auth.sh check <service>
bash ~/.workshop/login.sh start <service>   # render | neon | revyl | firstdraft
bash ~/.workshop/login.sh stop <service>    # not for firstdraft
bash ~/.workshop/login.sh status <service>  # still waiting, ended, or timed out? (not for firstdraft)
bash ~/.workshop/login.sh wait <service>    # after the approval: let it save, then check
bash ~/.workshop/render-workspace.sh        # after the Render sign-in (step 3)
bash ~/.workshop/cloudinary.sh open|save    # Cloudinary key (step 3)
bash ~/.workshop/neon-key.sh open|save      # Neon API key, only if Neon's browser sign-in fails
bash ~/.workshop/open.sh <link>             # open any page in the attendee's browser
```

`login.sh start` starts the sign-in in the background and returns within about 30 seconds
(First Draft's works differently; see step 4). It prints one of:

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
fails, do not start a GitHub sign-in: treat it as a step that failed twice (see Rules).

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
   ID. Any one will do: it only makes the Render CLI work. Before each app's first deploy, the
   deploy step has them create that app's own workspace and sets it, so they need not choose one
   for their apps now.
2. **Render on GitHub** (no check). Render needs permission to read the code they put on GitHub.
   Run `bash ~/.workshop/open.sh https://github.com/apps/render/installations/new`. On that
   GitHub page they choose their own account, choose **All repositories** (their app's
   repository may not exist yet), and click **Install**. If GitHub sends them on to Render and
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
   1. Run `bash ~/.workshop/open.sh https://console.neon.tech`. They need a **personal** API
      key. In the Neon console they open the profile menu at the top right, then **Account
      settings**, then **API keys**, click **Create new API key** (any name, such as `workshop`),
      and copy the key. Neon shows it only once. Tell them not to use the organization's
      **Settings** > **API keys** page: an organization or project key saves, but neonctl cannot
      use it to sign in.
   2. Run `bash ~/.workshop/neon-key.sh open`. It opens a private file in the editor. They paste
      the key after `NEON_API_KEY=` and save the file (Ctrl+S, or Cmd+S on a Mac), then tell you.
   3. Run `bash ~/.workshop/neon-key.sh save` and follow what it prints. `save` runs
      `auth.sh check neon` itself, so `SAVED:` means Neon is done. On `NEXT:` or `INVALID:`,
      pass on what it says and run `save` again after they fix the file. A key that is the wrong
      kind (an organization or project key) or that Neon rejects does not count as a failed
      step: they create a new personal key as in step 1 and paste it into the same form in place
      of the old one. If that second personal key also fails, stop Neon as the Rules say.

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

If Revyl's sign-up page shows an error or a security check, the network may be blocking it:
suggest they try again on another network, such as their phone's hotspot. If they cannot, or it
still fails, stop Revyl as the Rules say.

Once the check passes, tell them in a few sentences how the phone preview works later: the link
opens a phone in this browser; one phone runs at a time, and they ask you to stop it when they
are done looking. If Revyl says "Concurrency limit reached", the last phone is still shutting
down: wait 15 to 30 seconds, then ask you to stop it again (or stop it on the Revyl dashboard
under Sessions). The free plan is enough, so they ignore any offer to upgrade.

### 4. First Draft (`firstdraft`)

First Draft is what they will use to plan and build their app. They sign in with their GitHub
account. Before you start the sign-in, tell them what they will see:

1. If First Draft's page asks them to sign in, they choose **Sign in with GitHub**. GitHub may
   ask them to authorize First Draft: they approve.
2. The first time, First Draft asks them to agree to its terms of service and privacy notice.
   They read them and decide themselves; never agree for them.
3. First Draft shows the code: they check that it is the code you showed them and choose
   **Continue**. The next page asks them to approve the sign-in for this Codespace. Until they
   have answered it once, the same page also asks one question about what their coding agent
   may send to First Draft. Either answer works, and they can change it later at
   https://firstdraft.com/account. They approve, then tell you.

If its check names a token variable First Draft did not accept, do not start a login; see the
last item below. If it says `firstdraft start failed:`, First Draft did not answer the check:
do not start a login either. For `account_unavailable` or `rate_limited`, wait as long as it
says (a minute when it names no time) and run the check again; for anything else, such as
`update_required`, show them what it says. Otherwise run
`login.sh start firstdraft`. It runs the First Draft plugin's own CLI and returns at once:
nothing waits in the background. It prints `URL:` and `CODE:`, then `OPENED` or `NOT OPENED`,
then when the link and the code expire, or `NO LINK` as above. Show them as above; the link
usually includes the code, so the page already shows it, and if the page asks for the code, it
is the `CODE:`. When they say they approved, run `login.sh wait firstdraft`.
It finishes the login and prints First Draft's answer, then the check. An answer that starts
`NOT FINISHED:` is the CLI's error and says what to do: always show it to them and follow it,
for example running `login.sh wait firstdraft` again when it says to retry. Otherwise a `[PASS]`
check means First Draft is done, whatever the answer above it. With `[FAIL]`:

- `Still waiting:`: First Draft has not seen the approval yet. Ask whether they finished
  approving, then run `login.sh wait firstdraft` again.
- `Expired:` or `No login is waiting:`, or a `NOT FINISHED:` error that does not say to retry:
  run `login.sh start firstdraft` again and give them only the new link.
- `Refused:`: they denied it. Ask them before you start another.
- A check that names a token variable First Draft did not accept: show them what it says. A
  token set in this Codespace, for example from their Codespaces secrets, takes the place of
  any login, so signing in again does not help until they replace or remove it.

If it fails twice, stop as the Rules say. `stop` and `status` do not apply to First Draft.

## Finishing

Run `bash ~/.workshop/auth.sh check all`. When every line shows [PASS] and you did not stop
**Render on GitHub**, tell the attendee:

> You're all signed in! To start building, type `/clear` for a fresh conversation (in Codex,
> `/new`). Then follow **Part 3** of the workshop instructions.

When some lines still show [FAIL], or you stopped **Render on GitHub** (it has no check), tell
them which sign-ins passed and which are missing, with what each missing one is for; Render on
GitHub is needed before the first deploy. If First Draft passed, they can start Part 3 now, as
above. If First Draft is missing, they need it before Part 3. Either way, they can run
`/workshop-signin` (in Codex, `$workshop-signin`) again later: it redoes only what is missing,
and it comes back to Render on GitHub as well.
