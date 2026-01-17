# Local Schedule-Calendar — User Guide

This project is a zero-dependency (pure HTML/CSS/JS) single-page application for local schedule and task management. Data is stored by default in the current browser’s local storage (localStorage) and does not rely on any cloud service.

This user manual may not be comprehensive and may contain omissions or errors; in case of any inconsistency with the actual interface behavior, please refer to the application interface display and actual operation results. Most functions have intuitive prompts in the interface, and users can usually understand and complete the operations through page interaction.

---

## Table of Contents

- [1. Requirements](#1-requirements)
- [2. Quick Start](#2-quick-start)
- [3. UI and Views](#3-ui-and-views)
- [4. Features](#4-features)
  - [4.1 Countdowns](#41-countdowns)
  - [4.2 Today Tasks](#42-today-tasks)
  - [4.3 Lanes](#43-lanes)
- [5. Data Storage and Privacy](#5-data-storage-and-privacy)
- [6. Backup, Export, and Import](#6-backup-export-and-import)
- [7. Shortcuts and Interactions](#7-shortcuts-and-interactions)
- [8. Known Limitations](#8-known-limitations)
- [9. Disclaimer](#9-disclaimer)
- [10. Feedback and Support](#10-feedback-and-support)

---

## 1. Requirements

- OS: Windows / macOS / Linux
- Browser: **Chrome / Edge** (latest or relatively recent versions recommended)
- Network: Internet connection is not required

> Note: This application uses the browser’s `localStorage` for local persistence. In some environments (e.g., Private/Incognito mode, strict privacy settings, enterprise policies), local storage availability may be limited.

---

## 2. Quick Start

After extracting the package, keep the following files in the same directory:

- `index.html`: Entry page
- `styles.css`: Styles
- `app.js`: Application logic
- `calendar.ico`: Icon
- `LocalCalendarLauncher.bat`: Windows launcher (optional)

### Option A: Open Directly (Simplest)

1. Extract the zip package.
2. Double-click `index.html` to open.

### Option B: Windows Launcher (Optional)

On Windows, double-click `LocalCalendarLauncher.bat`:

- Creates a desktop shortcut (with icon)
- Opens `index.html` automatically

---

## 3. UI and Views

- Top toolbar: view switching, search, backup/import/export, settings, etc. (based on actual buttons in the UI)
- Main views:
  - **Month**: browse by month and view markers
  - **Week**: view daily summaries for a week
  - **Today**: focus on the current day
- Right-side drawer: opens after clicking a day, used to edit that date’s countdowns and tasks

---

## 4. Features

### 4.1 Countdowns

Countdowns record a target date with a title/notes, and the UI displays remaining days/status.

Common actions:

- Create: click “Add Countdown / Add” in the drawer
- Edit: click an item to edit
- Delete: select delete from the item menu

Notes:

- Countdowns are stored by **target date**. If you create a countdown from a certain day’s drawer but set its target date to a different day, it will be saved under the target date’s data.

### 4.2 Today Tasks

Today Tasks supports a tree structure (parent/child tasks) for breakdown and tracking.

Common actions:

- Add task: add a task in the “Today Tasks” area
- Add subtask: add a child item under a task
- Complete/undo: toggle task completion status
- Delete: delete a single task (child-handling follows the UI logic)

### 4.3 Lanes

Lanes support kanban-style management (e.g., Inbox / In Progress / Done).

Common actions:

- Add lane: create a new column
- Add card: add an item within a lane
- Edit/delete: click a card to edit, or delete via the menu

---

## 5. Data Storage and Privacy

- Default storage location: browser `localStorage`
- Data scope: applies only to the current browser and current user profile
- Clearing impact: clearing site data/cache may remove stored data

Recommendations:

- Use “Export/Backup” regularly for important data
- To migrate to another device, use the “Export → Import” workflow

---

## 6. Backup, Export, and Import

- **Create Backup**: save a historical snapshot inside the browser
- **Export**: export to a `.json` file (for migration/archiving)
- **Import**: restore data from a `.json` file

---

## 7. Shortcuts and Interactions

- `Esc`: close dialogs/drawer
- `Enter`: confirm dialogs (e.g., OK/Save)
- See the Settings page for more

---

## 8. Known Limitations

This version uses `localStorage` as the default persistence mechanism. The following limitations are related to browser constraints and edge behaviors:

1. **Storage quota**: `localStorage` has a capacity limit. When approaching or reaching the limit, writes may fail and throw quota exceptions (often observed as “changes no longer persist”). It is recommended to export archives regularly and clean up unnecessary historical backups when needed.
2. **Environment policy differences**: Private/Incognito mode, enterprise policies, or strict privacy settings may make local storage unavailable or non-persistent.
3. **Edge behavior under rapid dialog triggering**: In rare cases (e.g., rapidly triggering multiple dialogs), keyboard confirmation actions may be handled more than once.
4. **Potential date-record growth**: When browsing views, the application may create empty records for dates that were viewed but not filled in, which may cause storage usage to increase slowly over time.
5. **No cloud sync**: Data is stored only within the current browser environment. Cross-device or cross-browser migration requires export/import.

---

## 9. Disclaimer

This project is provided “AS IS” without warranty of any kind, express or implied, including but not limited to fitness for a particular purpose, reliability, error-free operation, or uninterrupted availability.  
To the maximum extent permitted by law, the author shall not be liable for any damages arising from the use of, or inability to use, this project, including but not limited to data loss, business interruption, loss of profits, or other indirect/incidental damages.

---

## 10. Feedback and Support

To report issues, please submit an Issue in the GitHub repository and include: browser version, how you opened the app, reproduction steps, and screenshots (the more details, the better). Due to limited maintenance capacity, issues may not be addressed in the short term.
