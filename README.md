#  Focus Mode — Chrome Extension

A lightweight Chrome extension that hides distracting elements on any webpage so you can focus on what matters.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-6366f1?style=flat-square&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-22c55e?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## Features

- **Auto-detect distractions** — Automatically dims sidebars, ads, comments, related content, cookie banners, newsletter popups, and more
- **Smart content detection** — Finds and highlights the main content area of the page
- **Manual element picker** — Click on any element to hide it completely (press `Esc` to stop picking)
- **Undo support** — Restore hidden elements one at a time
- **Hover to peek** — Dimmed elements become slightly visible on hover
- **Per-site state** — Extension remembers if Focus Mode is active per domain
- **Zero permissions abuse** — Only requests `activeTab`, `scripting`, and `storage`

## How It Works

Focus Mode uses a curated list of CSS selectors to identify common distracting elements (sidebars, ads, comments, social widgets, etc.) and applies a dim + blur effect to them. It also uses a heuristic to find the main content area and highlights it with a subtle border.

For anything the auto-detection misses, the **Element Picker** mode lets you click on any element to hide it entirely.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/focus-mode-extension.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `focus-mode-extension` folder

## Project Structure

```
focus-mode/
├── src/
│   ├── popup/
│   │   ├── popup.html      # Popup UI
│   │   ├── popup.js        # Popup logic & messaging
│   │   └── popup.css       # Popup styles
│   ├── content/
│   │   ├── content.js      # Core logic: reader mode engine
│   │   └── content.css     # Reader overlay styles
│   └── assets/
│       └── icons/          # Extension icons
├── manifest.json           # Extension config (Manifest V3)
├── .gitignore
├── .editorconfig
├── LICENSE
└── README.md
```

## Tech Stack

- **Vanilla JS** — No frameworks, no build step, no dependencies
- **Chrome Extensions Manifest V3** — Latest extension platform
- **CSS transitions & filters** — Smooth dimming and blur effects
- **Chrome Messaging API** — Communication between popup and content script
- **Chrome Storage API** — Persist state across sessions

## What I Learned

- Chrome Extension architecture: content scripts, popups, service workers, and how they communicate
- DOM traversal heuristics for identifying semantic page regions
- Manifest V3 permissions model and security best practices
- CSS `pointer-events`, `filter`, and `z-index` stacking for non-intrusive overlays

## License

MIT — free to use, modify, and distribute.
