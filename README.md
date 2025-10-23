# Kominfo Himakom Photobooth


Prerequisites
- If you don't have Node.js or Git installed, install them first (see short instructions below).
- Node.js (LTS recommended) installed and available on PATH
- Git

Quick install (Windows / macOS / Linux)
- Windows: download Node.js from https://nodejs.org/ and Git from https://git-scm.com/download/win, then run the installers.
- macOS: install Homebrew (https://brew.sh/) then run `brew install node git` in Terminal.
- Linux (Debian/Ubuntu): run `sudo apt update && sudo apt install -y nodejs npm git` (or use NodeSource for newer Node versions).
---

## How to Start this app

1) Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/<your-username>/kominfo-photobooth.git
cd kominfo-photobooth
```

2) Install dependencies

The project uses npm. Install dependencies with:

```bash
npm install
```


3) Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser



Troubleshooting
- If `npm install` fails, ensure you have a recent Node.js and network access.
- If the app makes external API calls that require keys, set them in `.env.local` before building.

