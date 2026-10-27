# Security Policy

## What this project is

specgate is a governance kit for repositories AI agents work in: markdown templates, two
agent skills, and a local CLI (`specgate init`, `specgate check`). It has zero runtime
dependencies, makes no network calls, and stores everything as plain markdown inside your
repository.

## Scope

In scope:

- The CLI (`src/`, `dist/`) — argument handling, file discovery, add-only writes, exit codes.
- The shipped templates (`templates/`) and agent skills (`skills/`).

Out of scope:

- Third-party agent tools and how they read rule files or pointer files. The support matrix
  in the README was verified at release time (2026-10); the check verifies that a pointer
  file exists and points at `AGENTS.md`. It cannot verify third-party behavior.
- Repository contents the kit does not create. The kit only adds files; it never edits yours.

## Injection surface: templates executed by an agent

The main risk for a kit like this is a document being treated as instructions. Mitigations
already in place:

- **Every command in the README, `INSTALL.md`, and the skills is ask-first.** An agent asks
  you before running anything; nothing runs on its own.
- **Templates carry commands as documentation, not as something the kit executes.** `specgate
  check` reads files and prints findings; it writes nothing and executes nothing.
- **`specgate init` is add-only.** It never modifies an existing file, so a template cannot
  silently rewrite rules already in your repository. Collisions are listed for you to decide.
- **Rollback is clean.** Everything created is new markdown; delete the added files or revert
  the commits and the repository is exactly as before.

If you find a way to make the kit run a command without your approval, or to get `init` to
modify an existing file, that is a security issue. Report it.

## Reporting a vulnerability

Report privately through **GitHub Security Advisories** on this repository
("Security" → "Report a vulnerability"). That keeps the report confidential until a fix and
advisory are ready.

Email fallback: none for v0.1 — GitHub Security Advisories (above) is the single channel.

Please do not open a public issue for an unpatched vulnerability.

What to include: what you ran, expected versus actual output, Node.js version, platform, and
the smallest reproduction you can share.

## Response times

- **First response: within 72 hours** of the report being received — an acknowledgment and a
  rough assessment, not necessarily a fix.
- If we confirm the report, we work toward a fix and coordinate disclosure with you.
- We may ask for clarification; the clock restarts if we are waiting on information from you.

## Notes

- No credentials, keys, or secrets are stored by the kit; there is no server and no database.
- Supported versions: current releases only. Older versions are not separately patched.
