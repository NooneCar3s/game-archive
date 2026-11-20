# Game Archive

**Your personal library for gaming screenshots.**

Game Archive is a desktop application designed to help you organize, manage, and revisit your gaming memories. Import screenshots, organize them by game and album, mark your favorites, and browse your collection in a clean, modern interface.

## ✨ Features

- **Screenshot Library** — Keep all your gaming screenshots in one place.
- **Game Organization** — Automatically organize screenshots by game.
- **Albums** — Create custom albums and group your favorite moments.
- **Favorites** — Quickly access your most memorable screenshots.
- **Watched Folders** — Monitor selected folders and automatically import new screenshots.
- **Duplicate Detection** — SHA-256 hashing prevents duplicate screenshots from being imported.
- **Thumbnail Generation** — Optimized thumbnails make browsing large collections faster while preserving original image quality.
- **Search & Filtering** — Find screenshots by game, album, or search query.
- **Full-Size Viewer** — View original screenshots with convenient navigation.
- **Local Storage** — Your screenshots and library data stay on your device.

## 🎨 Design

Game Archive features a modern dark interface inspired by gaming aesthetics, with glass-like surfaces, subtle neon accents, smooth animations, and a focus on making your screenshot collection enjoyable to explore.

## 🛠️ Tech Stack

- **React**
- **TypeScript**
- **Vite**
- **Tauri 2**
- **Rust**
- **SQLite**
- **Tailwind CSS**
- **Motion**
- **React Virtuoso**

## 📦 Installation

Download the latest Windows installer from the [GitHub Releases](../../releases) page.

Run the `.exe` installer and follow the installation instructions.

## 💻 Development

### Prerequisites

- Node.js
- npm
- Rust (stable)
- Microsoft C++ Build Tools
- Tauri 2 development prerequisites

### Getting Started

Clone the repository:

```bash
git clone <repository-url>
cd game-archive
```

Install dependencies:

```bash
npm install
```

Run the application in development mode:

```bash
npm run tauri dev
```

Build the application:

```bash
npm run tauri build
```

Build artifacts are generated in:

```text
src-tauri/target/release/bundle/
```

## 🔒 Privacy

Game Archive is designed as a local-first application. Your screenshot library is stored locally on your device. Original screenshots are not modified during import or thumbnail generation.

## 📌 Project Status

Game Archive is actively developed. Features and interface may evolve over time.

---

**Game Archive — Keep your gaming memories alive.**
