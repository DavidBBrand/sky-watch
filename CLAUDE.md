# CLAUDE.md

## Known gotchas

### `backend/starlink_backup.json` conflicts on pull/rebase

This file is a cache of Starlink TLE data. It is **intentionally tracked**
and committed daily by `.github/workflows/refresh-starlink-tles.yml`, a cron
job that fetches fresh data from space-track.org and pushes straight to
`main` (commits show up as "chore: refresh Starlink TLEs [skip ci]"). It's
also written locally by `backend/main.py`'s `/starlink-live` endpoint as a
fallback cache.

Because it changes upstream almost every day, it's the file most likely to
show a stale "both modified" / "modify-delete" conflict during `git pull`,
especially if a previous pull/rebase was interrupted. **Do not try to
gitignore or untrack it** — that breaks the daily workflow (GitHub Actions
runs with `set -e`, and `git add` on a gitignored path exits non-zero,
so the workflow's commit step fails outright).

The content itself is disposable — it's just a data cache, not
hand-authored. If it conflicts:

```bash
git add backend/starlink_backup.json   # accept whichever version is present
git rebase --continue                  # or: git commit, if mid-merge
```

If `git status` shows it as "both modified" with no `MERGE_HEAD` /
rebase in progress, that's a stale unmerged index entry from an earlier
interrupted operation — same fix: `git add backend/starlink_backup.json`
resolves it.
