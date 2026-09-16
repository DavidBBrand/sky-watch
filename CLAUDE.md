# CLAUDE.md

## Known gotchas

### `backend/starlink_backup.json` / `backend/satellite_watchlist_backup.json` conflicts on pull/rebase

Both files are TLE data caches. They are **intentionally tracked** and
committed daily, together, by `.github/workflows/refresh-starlink-tles.yml`,
a cron job that fetches fresh data from space-track.org and pushes straight
to `main` (commits show up as "chore: refresh Starlink + satellite-watchlist
TLEs [skip ci]"). Each is also written locally as a fallback cache by its
matching backend endpoint — `starlink_backup.json` by `/starlink-live`,
`satellite_watchlist_backup.json` by the `_fetch_watchlist_tles()` helper
`/satellite-passes` uses.

Because they change upstream almost every day, these are the files most
likely to show a stale "both modified" / "modify-delete" conflict during
`git pull`, especially if a previous pull/rebase was interrupted. **Do not
try to gitignore or untrack either one** — that breaks the daily workflow
(GitHub Actions runs with `set -e`, and `git add` on a gitignored path exits
non-zero, so the workflow's commit step fails outright).

The content itself is disposable — it's just a data cache, not
hand-authored. If either conflicts:

```bash
git add backend/starlink_backup.json backend/satellite_watchlist_backup.json  # accept whichever version is present
git rebase --continue                  # or: git commit, if mid-merge
```

If `git status` shows one as "both modified" with no `MERGE_HEAD` /
rebase in progress, that's a stale unmerged index entry from an earlier
interrupted operation — same fix: `git add` the affected file resolves it.

### Render's outbound IP is blocked by space-track.org's login API

`POST https://www.space-track.org/ajaxauth/login` returns a hard 403 for
every request made from Render, even though the exact same credentials work
fine from a browser, from the space-track.org web UI, and from any
non-Render machine (confirmed by testing side-by-side — same creds, 403 from
Render's IP, 200 everywhere else). It's not bad credentials and not an
account lockout — those show a lockout message in the space-track web UI,
and this doesn't. It's an IP-level block on the automated login endpoint
specifically.

Practical upshot: **any backend code that needs space-track.org TLE data
must not call it live from a Render request path** — it will reliably fail
there. The working pattern (used by both `/starlink-live` and
`/satellite-passes`) is: fetch TLEs from a GitHub Actions runner (a
different, unblocked IP) on a schedule, commit them to a tracked backup JSON
file, and have the backend read that file as a fallback when the live
attempt fails. Don't try to fix a "space-track 403 on Render" by tweaking
headers, retry logic, or request timing — none of that addresses an IP
block. Add the satellite to `refresh-starlink-tles.yml`'s fetch step and a
matching backup-file read in `main.py` instead.
