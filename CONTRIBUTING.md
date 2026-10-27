# Contributing

Thanks for reading this. Small, reviewable changes are the easiest to merge.

## Set up and run the tests locally

Requirements: Node.js >= 18. There are no runtime dependencies and no install step to build
the source.

```bash
git clone <your-fork> && cd specgate
npm test            # same as: node test/smoke.mjs
```

`test/smoke.mjs` is a black-box smoke suite: it runs the real CLI through
`child_process`, asserts exit codes and on-disk effects, and needs no framework. It exits
non-zero if any assertion fails.

To run the CLI from the checkout while developing:

```bash
node src/cli.mjs --version
node src/cli.mjs init <dir> --stage S0 --owner You --project-name Demo
node src/cli.mjs check <dir> --strict
```

## CI requirements

- `npm test` must pass.
- The package must stay dependency-free at runtime: no additions to `dependencies`.
- `prepack` runs `node scripts/build.mjs`; keep `src/` and `dist/` consistent.
- The kit must remain offline: no network calls from `src/`.

## Pull request criteria

Before a PR is considered ready:

1. **Claims tests all green.** `node test/smoke.mjs` passes with no failures. If your change
   alters observable behavior, add or adjust the assertions that cover it.
2. **No new promises beyond the shipped behavior.** Documentation and release artifacts must
   not claim a feature the code does not implement. If something is planned, mark it as
   upcoming or move it out of the claims.
3. **Add-only stays add-only.** Nothing in this project may modify a user's existing file.
4. **Ask-first stays ask-first.** Any command surfaced to an agent remains one the user
   approves before it runs.
5. **One concern per PR**, with the change traceable to the problem it addresses.
6. **Changelog entry** under `Unreleased` for user-visible changes (see CHANGELOG.md).

Expect review feedback on correctness and on scope. Keep the diff minimal.

## Code of conduct

Be kind, specific, and respectful; keep discussions about the work.
