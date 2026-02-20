# 🌿 Aoraeth Life Map — Project Overview

## 🎯 Purpose
A full-screen React whiteboard for visualizing learning goals as a "Digital Garden." It transforms raw completion logs into a hydraulic flow visualization, showing the "energy" or "water" flowing from resources into life goals.

## 🏗️ Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS 3 (Warm Editorial theme)
- **Icons:** Lucide-React
- **Data Parsing:** PapaParse (CSV)

## 📂 File Map
- `src/App.tsx`: Main entry wrapper.
- `src/components/SanctuaryMap.tsx`: The "Brain." Handles canvas logic, dragging, linking, and state management.
- `src/components/SeedBank.tsx`: Sidebar for dormant ideas/backlog items.
- `src/services/storage.ts`: Data abstraction layer. Bridges the app to `localStorage` (dev) and eventually `browser.storage.local`.
- `src/utils/flow.ts`: Mathematical engine for calculating "Hydraulic Flow" from logs.
- `src/utils/geometry.ts`: Calculates docking points and perimeter intersections for lines.
- `src/types/schema.ts`: TypeScript definitions matching `SCHEMA.md`.

## 🌊 Data Flow
1. **Input:** `logs.csv` (Completion heartbeat from Sidebar).
2. **State:** `nodes.csv` (Spatial positions) and `edges.csv` (Connections/Weights).
3. **Logic:** `calculateFlow` propagates "minutes" from sources to hubs based on edge weights (1=Trickle, 2=Stream, 3=River).
4. **Visuals:** Nodes change appearance based on "Season" (Spring/Autumn/Winter) and flow activity.

## 🛠️ Key Interaction Concepts
- **Magnet Mode:** Moving a parent node (`bed` or `hub`) automatically shifts all its children.
- **Plug System:** Drag from the circular "Plug" at the bottom of a node to another node to create a flow connection.
- **Seed Bank:** Drag items from the right sidebar onto the canvas to "plant" them (instantiate them as nodes).
- **Snapshot Mode:** Toggles a high-fidelity view for exporting/viewing the map without UI clutter.

## 🔄 Integration Note
The whiteboard is designed to be a standalone `plugin://` page within the Aoraeth Firefox extension, sharing a common data backbone with the sidebar via the browser's storage API.

## ?? Advanced Features
### ? Questions (Memos)
- **Concept**: Non-quantitative nodes used for open inquiries or reflective prompts (e.g., 'How to achieve financial freedom?').
- **Design Thought**: Questions serve as architectural landmarks. They don't aggregate hours but follow the same hierarchy, linking inquiries to the goals they inform.

### ?? Energy Magnitude (Leaf Levels)
- **Concept**: A visualization mode that replaces numbers with 1-5 leaf icons.
- **Design Thought**: Reduces cognitive load by showing relative dedication levels, dynamically normalized to the highest energy node on screen.
