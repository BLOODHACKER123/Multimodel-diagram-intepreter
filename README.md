# Multimodal Diagram Interpreter

An accessibility prototype that converts static STEM diagrams (ER models, graphs, cloud architectures) into interactive, audio-haptic spatial maps for low-vision learners.

## Features

- Upload any diagram image or load a built-in sample.
- AI extracts nodes, edges, labels, and spatial coordinates.
- Drag your finger or mouse across the canvas to hear components and feel haptic feedback.
- Double-tap or press `Q` to ask questions about the selected element.
- Full keyboard and screen-reader support via a text outline and ARIA live regions.
- Mock mode works without any API key; add a `DASHSCOPE_API_KEY` to use real Qwen-VL extraction.

## Quick start

```bash
# 1. Install dependencies (both server and web workspaces)
npm install

# 2. Configure environment (optional; mock mode works out of the box)
cp .env.example server/.env
# Edit server/.env and add DASHSCOPE_API_KEY to use Qwen-VL

# 3. Start the API and the web app
npm run dev
```

- API: http://localhost:3001
- Web app: http://localhost:5173

## Interaction guide

| Action | Mouse | Touch | Keyboard |
|---|---|---|---|
| Explore | hover | drag finger | Tab / arrows |
| Read description | click | tap | Enter / Space |
| Ask a question | double-click | double-tap or long-press | Q |
| Next / previous node | — | — | N / P |
| Cycle edges | — | two-finger swipe | E |
| Help | — | — | ? |
| Close dialog | — | — | Escape |

## Project structure

- `server/` — Express API, provider abstraction, graph normalization, mock fixtures.
- `web/` — React + Vite frontend, SVG canvas, speech/haptic hooks, accessibility components.

## Scripts

- `npm run dev` — start API and web dev servers.
- `npm run build` — build the production web bundle.
- `npm start` — serve the production bundle and API from one process.
- `npm run typecheck` — type-check the web app.
