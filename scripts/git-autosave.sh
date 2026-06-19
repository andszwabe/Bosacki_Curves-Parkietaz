#!/usr/bin/env bash
# Autosave any uncommitted work on `dev` to a `wip:` commit and push it.
# Bare-minimum safety net for sessions where an agent's quota runs out
# mid-edit. Only acts on `dev`; ignores all other branches. Idempotent.
#
# Install (one-time):
#   crontab -e
#   */10 * * * * /home/and/Drive/02_Zlecenia/2605_Bosacki_Curves/parkietaz-app/scripts/git-autosave.sh >>/tmp/parkietaz-autosave.log 2>&1
#
# Disable: comment the cron line out. Or `chmod -x` this file.

set -eu

REPO="/home/and/Drive/02_Zlecenia/2605_Bosacki_Curves/parkietaz-app"
cd "$REPO"

# Only act on dev. Never touch main, recovery/*, or detached HEAD.
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
[ "$branch" = "dev" ] || exit 0

# Nothing to save?
git diff --quiet && git diff --cached --quiet && exit 0

ts="$(date '+%Y-%m-%d %H:%M:%S')"
git add -A
git -c user.name="Andrzej Szwabe" -c user.email="andszwabe@gmail.com" \
    commit -m "wip: autosave $ts" --no-verify

# Push (don't fail the script if the network is down — the commit is enough)
git push 2>/dev/null || echo "[$ts] push failed, will retry next run"
