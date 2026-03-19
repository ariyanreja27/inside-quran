# Inside Quran

## Package Manager

This project strictly uses **npm** as its package manager. Please do not use `bun`, `yarn`, or `pnpm`. `bun.lock` files are ignored.

## Building the Project

Build artifacts (like the `dist`, `dist-server`, and `dist-ssr` folders) are intentionally not committed to version control to avoid merge conflicts. You must build the project locally using:

```bash
npm run build
```

Only source code should be placed in version control.
