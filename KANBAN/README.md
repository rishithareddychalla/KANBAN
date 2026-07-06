# TaskFlow — Premium Kanban Board & Project Workspace

TaskFlow is a production-quality, modern, responsive, and visually stunning Trello-style Kanban Board. Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**, it features fluid drag-and-drop interactions powered by **dnd-kit** and offers an aesthetic inspired by Notion, Trello, and Linear.

This project is fully persistent locally via `localStorage`, featuring searchability, priority filters, clean state isolation, and micro-interactions optimized for professional use cases.

---

## 🚀 Features

- **Intuitive Drag and Drop**: Reorder tasks inside the same column or move tasks between columns with fluid animations using `@dnd-kit`.
- **Task Management**:
  - Add, edit, and delete tasks dynamically.
  - Set task priorities (`Low`, `Medium`, `High`) with premium gradient highlights.
  - Track creation dates and task metadata.
- **Advanced Filters**:
  - Fast search filtering across titles and descriptions.
  - Quick priority toggle filters (`All`, `Low`, `Medium`, `High`).
- **Data Persistence**: Automatic state saving to `localStorage` ensures no data loss on page refreshes.
- **Premium Aesthetics**:
  - Notion-inspired clean UI mixed with Linear-style dark mode and glowing highlights.
  - Modern glassmorphism overlays and blur effects.
  - Smooth scale animations on cards hover.
- **Responsiveness**:
  - Horizontal scrollable boards on mobile viewports.
  - Clean responsive grid layout on tablet viewports.
  - Elegant multi-column setup on desktops.
- **Accessibility & UX**:
  - Keyboard accessibility (close modals with `ESC`).
  - Active button and cursor states.
  - Distance activation constraint on drag sensors to support clicking icons and editing tasks without starting accidental drags.

---

## 🛠️ Tech Stack

- **Core**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Persistence**: Web Storage API (`localStorage`)

---

## 📂 Folder Structure

```text
src/
 ├── assets/          # Static assets and media
 ├── components/      # UI components
 │    ├── Board/      # Kanban board view wrapper
 │    ├── Card/       # Individual visual card and DnD wrapper
 │    ├── Column/     # Column container & drop-zone logic
 │    └── Modal/      # Create/Edit and Confirmation modals
 ├── hooks/           # Custom state management hooks
 ├── types/           # TypeScript type definitions
 ├── App.css          # CSS file
 ├── App.tsx          # Main layout wrapper
 ├── index.css        # Tailwind configurations and global styles
 └── main.tsx         # App bootstrapping entry point
```

---

## 💻 Installation

To run this project locally, ensure you have [Node.js](https://nodejs.org/) installed.

1. **Clone/Navigate to the directory**:
   ```bash
   cd KANBAN
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## 🔮 Future Improvements

- **Subtasks & Checklists**: Allow users to add individual subtasks inside cards with progress percentages.
- **Custom Columns**: Add, rename, and delete custom columns dynamically.
- **Collaborator Assignment**: Simulate adding team avatars to represent task assignees.
- **Dark/Light Mode Toggle**: Allow seamless switching between light glassmorphism and the default dark slate mode.
- **Activity Log**: Keep track of column movements and edits in a historical activity side panel.
