Why these shims exist

- Some downstream packages (e.g. `recharts`) import specific built files from `es-toolkit` (paths like `es-toolkit/compat/range` or `es-toolkit/dist/compat/array/last.js`).
- In some `es-toolkit` distributions those paths aren't packaged the same way, leading to `Module not found` or runtime import errors.

What we do in this repo

- `scripts/apply-shims.js` will create small compatibility files inside `node_modules/es-toolkit` after `npm`/`pnpm`/`yarn` installs. The script is run automatically via the `postinstall` script in `package.json`.
- The shims are minimal implementations or re-exports that satisfy the bundler/runtime expectations and keep the dev server and production build working.

Why this approach

- It's a low-risk, reversible fix that avoids forcing dependency downgrades or risky package upgrades across the project.
- The alternatives (upgrade/downgrade `es-toolkit` or `recharts`) can introduce other dependency conflicts.

Recommended long-term fixes

1. Try to upgrade/downgrade `es-toolkit` to a version that includes the expected `dist/compat` files and re-run `npm install`. If that works, remove the shim logic.
2. Use `patch-package` to create tracked patches for the node_modules modifications. This is slightly cleaner than ad-hoc shims and the patches live in `patches/` under source control.
3. Open an issue with `es-toolkit` to ask for consistent packaging of the `dist/compat` files so downstream users don't need shims.

If you want, I can:
- Add `patch-package` and convert these shims into actual patch files.
- Try to upgrade `es-toolkit` to remove the need for shims (I will test and revert if it breaks other deps).

Safety notes

- `apply-shims.js` backs up any files it overwrites (creates `.bak` copies). You can remove shims by deleting the files written by the script and restoring backups if present.
