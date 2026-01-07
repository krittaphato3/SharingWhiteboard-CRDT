# Sharing Whiteboard (CRDT)

A real-time collaborative whiteboard application enabling multiple users to draw, sketch, and brainstorm together on a shared infinite canvas. This project leverages **CRDTs (Conflict-free Replicated Data Types)** to ensure seamless data synchronization across all connected clients.

## 🚀 Features

* **Real-time Collaboration:** Multiple users can edit the whiteboard simultaneously with practically zero latency.
* **Infinite Canvas:** Built on top of [tldraw](https://tldraw.com/), providing a robust and performant drawing experience.
* **Room Management:** Create unique rooms for different sessions.
* **Room Security:** Support for password-protected rooms (implied by project structure).
* **Admin Dashboard:** Dedicated interface for managing active rooms.
* **Conflict Resolution:** Uses Yjs to handle data merging automatically and prevent conflicts.

## 🛠️ Tech Stack

### Client (Frontend)
* **Framework:** [React](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Whiteboard Engine:** [Tldraw](https://tldraw.com/)
* **Collaboration/CRDT:** [Yjs](https://github.com/yjs/yjs) & [y-websocket](https://github.com/yjs/y-websocket)
* **Styling:** CSS / Tailwind (if applicable)

### Server (Backend)
* **Runtime:** [Node.js](https://nodejs.org/)
* **Framework:** [Express](https://expressjs.com/)
* **WebSocket:** [ws](https://github.com/websockets/ws)
* **Sync Protocol:** y-websocket (custom implementation/extension)

## 📂 Project Structure

This repository is organized as a monorepo containing both the frontend and backend code:

* **`/client`**: Contains the React frontend application.
* **`/server`**: Contains the Node.js backend and WebSocket signaling server.

## 🏁 Getting Started

Follow these steps to run the project locally.

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 16+ recommended)
* npm or yarn

### 1. Setup the Server

The server handles WebSocket connections and room coordination.

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server
# (Check package.json for the specific start script, usually one of these:)
npm start
# OR
node index.js
