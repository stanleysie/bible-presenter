# Bible Presenter

A Windows desktop app for presenting Bible verses on a projector or second display — similar to EasyWorship or WorshipTools Presenter, focused only on Scripture.

## Features

- **Dual-window presentation** — operator control panel + fullscreen output on a second monitor
- **Indonesian TB** — Terjemahan Baru
- **Live Bible text** — verses loaded from [mayicu Alkitab API](https://mayicu.id/api/alkitab/v1/docs) as you browse, with local chapter caching
- **Reference lookup** — type references like `Yohanes 3:16` or `John 3:16` (one verse at a time; use arrow keys to advance)
- **Book/chapter/verse navigation** — browse and select verses
- **Show / Hide projector** — preview on the control panel, then show or hide output on the projector
- **Auto-fit text** — long verses scale down to fit the screen
- **Keyboard shortcuts** — `Esc` hide, arrow keys prev/next verse
- **Theme settings** — background and text colors

## Requirements

- Windows 10/11 (target platform)
- Node.js 20+
- **Internet connection** — required the first time a chapter is loaded; cached chapters work offline afterward

### Developing on WSL / Linux

Electron needs extra system libraries on Linux. If you see `libnss3.so: cannot open shared object file`, install them:

```bash
sudo apt-get update
sudo apt-get install -y \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2t64 libpango-1.0-0 libcairo2 libgtk-3-0
```

WSL also needs a GUI stack to show windows:

- **WSLg** (Windows 11): usually works out of the box after installing the packages above
- **WSL2 on Windows 10**: install an X server (e.g. VcXsrv) and set `export DISPLAY=:0`

If you see `Exiting GPU process due to errors during initialization`, use software rendering:

```bash
npm run dev:wsl
```

For day-to-day development with dual monitors, running `npm run dev` on native Windows is the most reliable option.

## Setup

```bash
npm install
npm run dev
```

## Build Windows installer

```bash
npm run dist
```

The installer will be in the `release/` folder.

> **Note:** Building the NSIS `.exe` installer on Linux/WSL requires [Wine](https://www.winehq.org/). On Windows, `npm run dist` works out of the box. You can also run the unpacked app from `release/win-unpacked/Bible Presenter.exe` after building.

## Bible text

TB (Terjemahan Baru) verse text is loaded from the [mayicu Alkitab API](https://mayicu.id/api/alkitab/v1/docs). See [LICENSING.md](LICENSING.md) for notes on use and distribution.

## Project structure

```
electron/     Main process, IPC, window management
src/          Operator control UI (React)
output/       Projector/audience output UI (React)
db/           Book metadata, API client, verse cache
shared/       Types and shared UI components
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Enter | Find reference (when search box is focused) |
| Esc | Hide projector output |
| ← / → | Previous / next verse |
