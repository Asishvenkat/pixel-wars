# PixelWars - Real-time Collaborative Strategy Game 

A high-performance, real-time multiplayer territory control game. Players compete to claim blocks, climb the leaderboard, and defend territory using strategic mechanics.

Built for the **InboxKit Intern Assignment**.

---

## How to Run

You will need **two terminal windows** (one for backend, one for frontend).

### 1. Start the Backend (Server)
```bash
cd server
npm install
npm start
```
*The server will start on port 3001.*

### 2. Start the Frontend (Client)
Open a new terminal:
```bash
cd client
npm install
npm run dev
```
*The app will open at `http://localhost:5173`.*

> **Tip**: Open the app in multiple browser tabs (or Incognito mode) to simulate multiple players!

---

## How It Works

1.  **User Action**: You click a block on the grid.
2.  **Client Emit**: The `capture_block` event is sent via Socket.io to the server.
3.  **Server Validation**: The `GridManager` checks:
    *   **Ownership**: Is the block locked by another player?
    *   **Cooldown**: Has the user waited 2 seconds since their last move?
4.  **State Update**: If valid, the server updates its in-memory `Map` (O(1) operation).
5.  **Persistence**: The state is saved to `grid_data.json` (debounced to avoid disk lag).
6.  **Broadcast**: The server emits a lightweight `block_update` event to **all connected clients**.
7.  **Client Sync**: All screens update instantly to show the new color.

##  How I Handled Real-Time Updates

I engineered the system to be robust against common distributed system challenges:

*   **Race Conditions**: When two users click the same tile simultaneously, the server processes the first event and efficiently rejects the second (due to the new lock), keeping all clients in sync.
*   **Stale UI Recovery**: If a client disconnects (e.g., network drop) and reconnects, it automatically requests the full grid state to ensure it matches the server.
*   **Bandwidth Optimization**: Instead of sending the full 400-block grid on every move, I broadcast only **deltas** (single block updates), minimizing data transfer.
*   **Bot Prevention**: A global cooldown + block-specific locks prevent script-spamming.

##  Trade-offs Made

1.  **In-Memory State vs. Database**:
    *   *Decision*: Used a Javascript `Map` with file-system backup (`fs`).
    *   *Why*: Zero-setup (easy to run), extremely fast O(1) access.
    *   *Trade-off*: Harder to scale to multiple servers compared to Redis.

2.  **DOM Grid vs. Canvas**:
    *   *Decision*: Rendered grid using React `div` elements.
    *   *Why*: Allows for easy CSS animations (pulse effects, hover states) and accessibility.
    *   *Trade-off*: Performance ceiling is lower (~5000 blocks) compared to WebGL, but perfect for a 20x20 interactive map.

3.  **Optimistic UI vs. Server Verification**:
    *   *Decision*: Wait for server acknowledgement before updating color.
    *   *Why*: Ensures the UI never lies about the game state (Consistency > Perceived Latency).

---

##  Bonus Features
*   ** Defense System**: Capturing a block **locks** it for 10s (🔒 icon).
*   ** Live Leaderboard**: Real-time ranking of top players.
*   ** Interactive Map**: Zoom/Pan controls for the battlefield.

## �️ Tech Stack
*   **Frontend**: React (Vite), Socket.io-client, CSS Variables.
*   **Backend**: Node.js, Express, Socket.io, File System (fs).
*   **Testing**: Native Node.js `assert`.


