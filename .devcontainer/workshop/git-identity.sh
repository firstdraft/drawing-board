#!/usr/bin/env bash
# git-identity.sh
#
# Sets git's name and email from the Codespace's GitHub account when they are missing: the
# account's name (or its username, if no name is set) and its private no-reply address,
# <id>+<username>@users.noreply.github.com, so commits link to the account without exposing a
# real email. A Codespace normally sets both itself; this keeps any it set.
# Installed to ~/.workshop/git-identity.sh by .devcontainer/setup-agents; used by the
# workshop-signin skill.
#
#   bash git-identity.sh

set -uo pipefail

if name=$(git config --global user.name) && email=$(git config --global user.email); then
    echo "[PASS] git-identity: $name <$email> (already set)"
    exit 0
fi

identity=$(gh api user --jq '"\(if (.name // "") == "" then .login else .name end)\t\(.id)+\(.login)@users.noreply.github.com"' 2>/dev/null) \
    || { echo "[FAIL] git-identity: the Codespace's GitHub sign-in did not answer"; exit 1; }
name=${identity%%$'\t'*}
email=${identity#*$'\t'}

git config --global user.name "$name"
git config --global user.email "$email"
echo "[PASS] git-identity: $name <$email>"
