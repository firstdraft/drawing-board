#!/usr/bin/env bash
# auth.sh
#
# Checks whether the attendee is signed in to each workshop service from this Codespace.
# Read-only; the workshop-signin skill does the signing in. The Codespaces copy of the laptop
# kit's auth.sh: the Codespace is already signed in to GitHub and sets git's name and email.
# Installed to ~/.workshop/auth.sh by .devcontainer/setup-agents.
#
#   bash auth.sh check all            one line per service; exit code = number missing
#   bash auth.sh check <service>

set -uo pipefail

# No 'claude' check: the attendee signs in to Claude before starting the skill.
SERVICES="github git-identity render render-workspace neon cloudinary revyl firstdraft"

export PATH="$HOME/.local/bin:$HOME/.revyl/bin:$PATH"
# Checks must never open a browser to start a sign-in.
export BROWSER=/bin/false
cd "$HOME" || exit 1


check_github() {
    # The Codespace signs gh and git in with its own GitHub token.
    local login
    login=$(gh api user --jq .login 2>/dev/null) || { echo "the Codespace's GitHub sign-in did not answer"; return 1; }
    echo "signed in as $login"
}

check_git_identity() {
    # Codespaces sets git's name and email from the GitHub account; git-identity.sh repairs them.
    local name email
    name=$(git config --global user.name) || { echo "git name not set"; return 1; }
    email=$(git config --global user.email) || { echo "git email not set"; return 1; }
    echo "$name <$email>"
}

check_render() {
    render whoami --output text --confirm </dev/null >/dev/null 2>&1 || { echo "not signed in"; return 1; }
    echo "signed in"
}

check_render_workspace() {
    # 'render login' does not choose a workspace; render-workspace.sh does.
    local current
    current=$(render workspace current --output text --confirm </dev/null 2>/dev/null) || { echo "no workspace set"; return 1; }
    echo "${current#Active Workspace: }"
}

NEON_PERSONAL_KEY="create a personal key instead (Neon console, profile menu at the top right, Account settings, API keys; not the organization's API keys) and paste it into the same form: bash ~/.workshop/neon-key.sh open"

check_neon() {
    # Ask neonctl which credential it will use. 'profile list' reads it offline and never starts a
    # sign-in; 'neonctl me' starts a browser sign-in when signed out, so it runs only after that.
    local profiles scope output status reason
    profiles=$(neonctl profile list --output json </dev/null 2>&1) || {
        echo "neonctl could not read its sign-in: $(neon_reason "$profiles")"
        return 1
    }
    scope=$(jq -r 'first(.[] | select(.active == "*")) | if .auth == "-" then "none" else .scope end' <<<"$profiles")
    case "$scope" in
        none | "") echo "not signed in"; return 1 ;;
        # profile create accepts organization and project keys, but they cannot read the user
        # ('neonctl me' gets "not allowed for organization API keys").
        org\ * | project\ *) echo "the saved key is an organization or project API key; $NEON_PERSONAL_KEY"; return 1 ;;
    esac
    output=$(timeout 20 neonctl me --output json </dev/null 2>&1 >/dev/null)
    status=$?
    [ "$status" -eq 0 ] && { echo "signed in"; return 0; }
    [ "$status" -eq 124 ] && { echo "neonctl did not answer within 20 seconds; check the internet connection and try again"; return 1; }
    reason=$(neon_reason "$output")
    case "$reason" in
        *"organization API key"*) echo "the saved key is an organization API key; $NEON_PERSONAL_KEY" ;;
        *"rejected"*) echo "Neon rejected the saved key ($reason); $NEON_PERSONAL_KEY" ;;
        *) echo "neonctl me failed: $reason" ;;
    esac
    return 1
}

neon_reason() {
    # neonctl's last error, first sentence only (the rest suggests neonctl commands the attendee
    # should not run), with anything token-length redacted.
    local line
    line=$(printf '%s\n' "$1" | grep -v '^[[:space:]]*$' | tail -n 1)
    line=${line#ERROR: }
    line=${line%%. *}
    printf '%s\n' "$line" | sed -E -e 's| \(/[^)]*\)||g' -e 's/[A-Za-z0-9_-]{24,}/[redacted]/g' | cut -c 1-200
}

check_cloudinary() {
    # Cloudinary has no CLI sign-in: the attendee pastes its key into a private file, and
    # cloudinary.sh checks the saved file's shape without printing it.
    [ -f "$HOME/.workshop/cloudinary.sh" ] || { echo "helper not installed (rerun .devcontainer/setup-agents)"; return 1; }
    bash "$HOME/.workshop/cloudinary.sh" check
}

check_revyl() {
    local status
    # 'revyl auth status' exits 0 even when signed out, so read what it says.
    status=$(revyl auth status 2>&1) || { echo "not signed in"; return 1; }
    case "$status" in
        *"Not authenticated"*) echo "not signed in"; return 1 ;;
    esac
    echo "signed in"
}

check_firstdraft() {
    # The CLI has no status command; 'firstdraft login' saves a token per origin in this file. jq
    # checks that a production token exists without printing it.
    local credentials="${XDG_CONFIG_HOME:-$HOME/.config}/firstdraft/credentials.json"
    jq -e '.origins["https://firstdraft.com"].access_token | type == "string" and length > 0' \
        "$credentials" >/dev/null 2>&1 || { echo "not signed in"; return 1; }
    echo "signed in"
}


run_check() {
    local service=$1 detail
    if detail=$("check_${service//-/_}" 2>&1); then
        echo "[PASS] $service: $detail"
        return 0
    fi
    echo "[FAIL] $service: $detail"
    return 1
}

case "${1:-}" in
    check)
        if [ "${2:-all}" = all ]; then
            missing=0
            for service in $SERVICES; do
                run_check "$service" || missing=$((missing + 1))
            done
            exit "$missing"
        fi
        run_check "$2"
        ;;
    *)
        echo "usage: auth.sh check all|<service>"
        exit 2
        ;;
esac
