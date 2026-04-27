# 📚 Classwork — Homework Tracker

A clean, dark-themed homework tracker that runs entirely in the browser. No backend, no login — just open and go.

## Features

- **Create classes** with custom color labels
- **Add assignments** with optional due dates
- **Track progress** — mark homework as done
- **Filter view** — Pending / Completed / All
- **Persistent** — data is saved to `localStorage`, so closing the tab won't lose your work
- **Responsive** — works on mobile too

## Running Locally

Just open `index.html` in your browser. No build step needed.

## Running on GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch**, pick `main` and `/ (root)`
4. Your site will be live at `https://<username>.github.io/<repo-name>/`

## File Structure

```
homework-tracker/
├── index.html   # App shell & markup
├── style.css    # All styling (CSS variables, dark theme)
├── app.js       # App logic + localStorage persistence
└── README.md    # This file
```

## Data Storage

All data is stored in your browser's `localStorage` under the key `classwork_data_v1`. Clearing browser data will reset the app.
