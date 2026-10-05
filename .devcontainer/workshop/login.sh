#!/usr/bin/env bash
# login.sh
#
# Starts a sign-in that waits for the browser, without blocking the agent: the sign-in keeps
# running in the background, and this script prints its link (and one-time code, if any) as soon
# as it appears, then returns. It also opens the link in the attendee's browser through VS Code.
# The Codespaces copy of the laptop kit's login.sh; GitHub is already signed in inside a Codespace.
# Installed to ~/.workshop/login.sh by .devcontainer/setup-agents; used by the sign-in skill.
#
#   bash login.sh start <service>    render | neon | revyl | firstdraft-device | firstdraft
#   bash login.sh stop <service>     cancel a sign-in that is still waiting
#   bash login.sh status <service>   is it still waiting, or did it finish / time out?
#   bash login.sh wait <service>     after the approval: give the sign-in up to 30 seconds to
#                                    save, then run its auth.sh check
#
# Starting again cancels the previous attempt for that service, because its link no longer works
# once a new one is created. Set WORKSHOP_NO_OPEN=1 to skip opening the browser (for tests).

set -uo pipefail

export PATH="$HOME/.local/bin:$HOME/.revyl/bin:$PATH"
# Stop the CLIs from opening a browser themselves (Render, Revyl and Neon all fall back to
# $BROWSER): this script opens the link once, the same way for every service.
export WORKSHOP_BROWSER="${WORKSHOP_BROWSER-${BROWSER:-}}"
export BROWSER=/bin/false

LOG_DIR="$HOME/.workshop/logs"
mkdir -p "$LOG_DIR"

action=${1:-}
service=${2:-}
expires_after=""          # set for CLIs whose sign-in gives up quickly

case "$service" in
    render) command=(render login) ;;
    neon)
        # neonctl's local listener for the browser's reply is on 127.0.0.1 inside the Codespace and
        # closes after 60 seconds, which cannot be changed. A browser tab of VS Code for the Web
        # cannot reach it; VS Code Desktop forwards the port. The skill falls back to an API key.
        command=(neonctl auth); expires_after=60 ;;
    revyl)  command=(revyl auth login) ;;
    # Approve with a code (the skill's first choice): nothing has to reach the Codespace from the
    # browser.
    firstdraft-device) command=(env -u FIRSTDRAFT_API_TOKEN FIRSTDRAFT_API_URL=https://firstdraft.com firstdraft login --device) ;;
    # The browser sends the approval back to 127.0.0.1 inside the Codespace, which only VS Code
    # Desktop forwards, so the skill tries this second.
    firstdraft) command=(env -u FIRSTDRAFT_API_TOKEN FIRSTDRAFT_API_URL=https://firstdraft.com firstdraft login) ;;
    *)
        echo "usage: login.sh start|stop|status|wait render|neon|revyl|firstdraft-device|firstdraft"
        exit 2 ;;
esac

log="$LOG_DIR/$service.log"
pid_file="$LOG_DIR/$service.pid"
# The auth.sh check for this service: firstdraft-device -> firstdraft.
check_service=${service%-device}

# Is the sign-in still running? The Codespace's PID 1 (`sleep infinity`) does not reap exited
# processes, so a finished sign-in stays a zombie that kill -0 still reports as alive.
running() {
    [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null && ! grep -qs '^State:[[:space:]]*Z' "/proc/$1/status"
}

stop_previous() {
    local pid
    pid=$(cat "$pid_file" 2>/dev/null) || return 0
    # The sign-in runs in its own process group (setsid), so stop the whole group.
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null
    rm -f "$pid_file"
}

if [ "$action" = stop ]; then
    stop_previous
    echo "STOPPED: $service sign-in cancelled"
    exit 0
fi
if [ "$action" = status ]; then
    pid=$(cat "$pid_file" 2>/dev/null)
    if running "$pid"; then
        echo "WAITING: the $service sign-in is still waiting for approval in the browser"
    elif grep -qi 'timed out' "$log" 2>/dev/null; then
        echo "TIMED OUT: the $service sign-in gave up before it was approved; start it again"
    else
        echo "ENDED: the $service sign-in is no longer running. Its last output:"
        sed 's/\x1b\[[0-9;]*[A-Za-z]//g' "$log" 2>/dev/null | tail -n 5
        echo "Run: bash ~/.workshop/auth.sh check $check_service"
    fi
    exit 0
fi
if [ "$action" = wait ]; then
    # A device sign-in saves its credential on the CLI's next poll, a few seconds after the
    # approval, and then exits; checking right away would report a sign-in that is about to pass.
    pid=$(cat "$pid_file" 2>/dev/null)
    for _ in $(seq 1 60); do
        running "$pid" || break
        sleep 0.5
    done
    if running "$pid"; then
        echo "WAITING: the $service sign-in has not received the approval yet"
    fi
    exec bash "$(dirname "${BASH_SOURCE[0]}")/auth.sh" check "$check_service"
fi
[ "$action" = start ] || { echo "usage: login.sh start|stop|status|wait <service>"; exit 2; }

stop_previous
: > "$log"
setsid nohup "${command[@]}" </dev/null >"$log" 2>&1 &
pid=$!
echo "$pid" > "$pid_file"

# The sign-in link in the output:
#   - a link that already includes the code, if there is one (First Draft's device sign-in prints
#     the link both without and with the code);
#   - otherwise the longest link: sign-in links carry long parameters, while other links in the
#     text are short (Revyl's banner links to its docs, which are skipped anyway).
find_link() {
    local links
    links=$(sed 's/\x1b\[[0-9;]*[A-Za-z]//g' "$log" | grep -oE 'https://[^ "<>]+' \
        | sed 's/[.,;:)]*$//' | grep -vE '://docs\.')
    printf '%s\n' "$links" | grep -E '[?&](user_)?code=' | head -n 1 | grep . \
        || printf '%s\n' "$links" | awk '{ print length, $0 }' | sort -rn | head -n 1 | cut -d' ' -f2-
}

# Wait up to 30 seconds for a link, or for the command to finish by itself (for example "already
# signed in", or an error).
for _ in $(seq 1 60); do
    [ -n "$(find_link)" ] && break
    running "$pid" || break
    sleep 0.5
done
sleep 1   # let a one-time code printed just after the link arrive too

clean=$(sed 's/\x1b\[[0-9;]*[A-Za-z]//g' "$log")

if ! running "$pid"; then
    rm -f "$pid_file"
    echo "FINISHED: the sign-in command exited without waiting for the browser. Its output:"
    printf '%s\n' "$clean" | tail -n 15
    echo "Run: bash ~/.workshop/auth.sh check $check_service"
    exit 0
fi

url=$(find_link)
# One-time codes: First Draft prints ABCD-EFGH, Render prints ABCD-EFGH-IJKL-MNOP.
code=$(printf '%s\n' "$clean" | grep -oE '\b[A-Z0-9]{4}(-[A-Z0-9]{4})+\b' | head -n 1)
if [ -n "$url" ]; then
    echo "URL: $url"
    [ -n "$code" ] && echo "CODE: $code"
    if [ "${WORKSHOP_NO_OPEN:-}" != 1 ]; then
        bash "$(dirname "${BASH_SOURCE[0]}")/open.sh" "$url"
    fi
    echo "WAITING: the sign-in is running in the background until it is approved in the browser."
    [ -n "$expires_after" ] && echo "EXPIRES: this sign-in gives up ${expires_after} seconds after it started; the attendee must approve right away."
    echo "After the attendee approves it, run: bash ~/.workshop/login.sh wait $service"
    exit 0
fi

echo "NO LINK: the sign-in did not print a link within 30 seconds. Its output:"
printf '%s\n' "$clean" | tail -n 20
stop_previous
exit 1
