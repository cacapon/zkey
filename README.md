<h1>
  <img src="assets/icon-markless.svg" width="64" style="vertical-align: middle;">
  ZKey – CLI-oriented Zettelkasten for Obsidian
</h1>

[日本語](README.ja.md)

A **Zettelkasten plugin for Obsidian** designed to create, connect, and grow notes entirely through keyboard operations.

Designed to keep your thinking uninterrupted — no mouse, no UI clicks required.

---

## Concept

- Everything done via keyboard
- Switch between note types using **modes** (e.g. Core / Temp / Ref)
- Behavior is determined by **context** (active mode, selected text, cursor position) — not UI

---

## Commands

| Command | Description |
|---|---|
| ZKey: Open or create Zettel | With text selected: wraps it in a link and creates the note. Cursor on a link: opens it. Otherwise: prompts for a note name. |
| ZKey: Link switcher | Lists forward links, backlinks, and 2-step links from the current note |
| ZKey: Go to root note | Opens the root note of the current mode |
| ZKey: Switch mode | Switch between modes |
| ZKey: Create mode | Create a new mode (auto-generates folder, root note, and template) |
| ZKey: Delete mode | Delete a mode from the list |

---

## What is a Mode?

A **mode** is a workspace tied to a specific type of note — for example, Core (main ideas), Temp (drafts), or Ref (references). You create modes for each context and switch between them as you work.

Each mode has:
- **Folder** — where notes are stored
- **Root note** — the entry point for the mode
- **Template** — used when creating new notes

---

## Settings

Available under Settings → ZKey.

| Setting | Description | Default |
|---|---|---|
| Auto switch mode | Automatically switches to the mode of the file you open | On |
| Insert zk-origin in body | Adds `↑: [[{{zk-origin}}]]` to the template when creating a mode | Off |
| Default note folder | Initial folder path when creating a mode | `Zk` |
| Template folder | Automatically sourced from the Obsidian Templates plugin settings | – |

---

## Installation

**Obsidian Community Plugins (coming soon)**

Settings → Community plugins → Browse → search `ZKey`

**BRAT (beta)**

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. Open BRAT settings and select "Add Beta plugin"
3. Enter the URL of this repository

---

## License

MIT License.
