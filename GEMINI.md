# Frontend Development Instructions

## Context
Stack: React (Vite), TypeScript, Tailwind CSS.

## Workflow
- **Linting:** Run `eslint --fix` on modified files.
- **Type Checking:** Run `npx tsc -b --noEmit`.
- **API Sync:** If the API changes, ensure `openapi.snapshot.json` or related types are updated.

## Blocked Operations
- Destructive git commands or force pushes.
- Systemd service stops for `copiale-p2p-vite`.
