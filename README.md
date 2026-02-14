# KindleWiki

A Chrome extension that transforms Wikipedia articles into a clean, Kindle-style reading experience. Built specifically for Wikipedia, KindleWiki strips away navigation, sidebars, and clutter to let you focus entirely on the article content.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-6366f1?style=flat-square&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-22c55e?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## Features

- **Kindle-style reader mode** — Extracts Wikipedia article text into a distraction-free overlay optimized for long-form reading
- **Multiple themes** — Light, sepia, and dark modes for comfortable reading in any environment
- **Customizable typography** — Adjust font size, font family (serif, sans, mono), and line spacing
- **Auto-generated table of contents** — Navigate long articles with a collapsible sidebar TOC built from article headings
- **Reading progress** — Progress bar tracks how far you've read through an article
- **Reading time estimate** — See estimated reading time before you dive in
- **Keyboard shortcuts** — `Esc` to close, `T` to cycle themes, `+`/`-` for font size
- **Persistent preferences** — Your settings are saved across sessions
- **Zero permissions abuse** — Only requests `activeTab`, `scripting`, and `storage`

## How It Works

KindleWiki activates on any Wikipedia page. When you enter reader mode, it extracts the article content from Wikipedia's DOM, strips out edit links, navigation boxes, reference lists, and other non-essential elements, then presents the clean text in a full-screen reading overlay with customizable typography and theming.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/kindlewiki.git
   ```
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `kindlewiki` folder

## Project Structure

```
kindlewiki/
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



## License

MIT — free to use, modify, and distribute.
