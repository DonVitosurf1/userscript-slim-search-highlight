# GitHub security settings

These are maintainer setup instructions, not a record of enabled protections. Repository access, GitHub plan, and organization policy determine which controls are available. Confirm the settings and a successful workflow run in GitHub after merging.

## Repository settings

Under **Settings → Security → Advanced Security / Code security** (GitHub labels may vary):

1. Enable the dependency graph, Dependabot alerts, and Dependabot security updates where available. `.github/dependabot.yml` schedules dependency updates but does not turn on these settings.
2. Enable secret scanning and push protection where offered. Review any existing alerts privately. The local pattern scanner supplements these controls and does not replace them.
3. Enable private vulnerability reporting. Verify that **Security → Report a vulnerability** is available, and review the reporting link in `SECURITY.md`.
4. Review code scanning after the `Security` workflow completes. This repository supplies an advanced CodeQL workflow; avoid creating a duplicate default CodeQL setup for the same language.
5. Set the default workflow token permission to read repository contents, and keep **Allow GitHub Actions to create and approve pull requests** disabled unless a documented workflow requires it. Require approval for workflows from outside contributors according to the repository's needs.

## Protect `main` with a ruleset

An importable starting point is [rulesets/main.json](rulesets/main.json). It requires PRs and passing checks, blocks force pushes/deletion, and uses zero mandatory approvals for a single-maintainer repository. If another reviewer is available, increase the approval count. Confirm the actual check names before activation; this file does not enable server-side protection by itself.

Under **Settings → Rules → Rulesets**, create an active branch ruleset targeting the default branch. Review any bypass roles rather than assuming the rules cover administrators.

- Require changes through a pull request. If another reviewer is available, require approval and dismiss stale approvals after new changes.
- After the new workflows have run, select their actual checks in GitHub: the test job (`test`), `Secret scan`, and `CodeQL JavaScript`. Confirm the names shown in the check picker; the labels alone do not prove enforcement. Require the branch to be up to date if that fits the merge process.
- Block force pushes and deletion of `main`. Require conversations to be resolved before merging.
- Consider required code scanning results and protected release tags if the repository's plan supports them. Signed commits are a separate team choice and require contributor setup.

Test the rules with a normal pull request before treating them as enforced. A workflow from a fork runs with restricted permissions; do not switch to `pull_request_target` to bypass that restriction. Review workflow changes as executable code.

## Local review

Run `node scripts/check-secrets.mjs` before committing and `node scripts/check-secrets.mjs --history` from a full clone before release. To inspect archive exclusions without changing the working tree, use `git archive HEAD` and confirm that `docs/archive/` is absent after the attributes are committed. Existing history and old release archives remain unchanged.
