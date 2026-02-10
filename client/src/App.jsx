import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Grid from './Grid';
import './index.css';

// Connect to backend
const socket = io(import.meta.env.PROD ? undefined : 'http://localhost:3001');

const GRID_SIZE = 20;

function App() {
  const [grid, setGrid] = useState(new Map());
  const [leaderboard, setLeaderboard] = useState([]);

  // User State
  const [myColor, setMyColor] = useState('#fff');
  const [myId, setMyId] = useState(null);
  const [myName, setMyName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [joinName, setJoinName] = useState('');

  // Connection State
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isJoining, setIsJoining] = useState(false);

  // UI State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Refs for event handlers (to access fresh state inside listeners)
  const stateRef = useState({ isJoined: false, myName: '' })[0];
  // Sync ref with state
  useEffect(() => { stateRef.isJoined = isJoined; stateRef.myName = myName; }, [isJoined, myName]);

  useEffect(() => {
    // Connection Events
    socket.on('connect', () => {
      setIsConnected(true);
      // Auto-rejoin if we were already playing
      if (stateRef.isJoined) {
        console.log("Reconnecting as", stateRef.myName);
        socket.emit('join_game', stateRef.myName);
      }
    });

    socket.on('disconnect', () => setIsConnected(false));

    // 1. Initial State
    socket.on('init_state', (stateArray) => {
      setGrid(new Map(stateArray));
    });

    // 2. Player Info
    socket.on('player_info', ({ id, color, name }) => {
      setMyId(id);
      setMyColor(color);
      setMyName(name);
      setIsJoined(true);
      setIsJoining(false);
    });

    // 3. Block Updates
    socket.on('block_update', (block) => {
      setGrid((prev) => {
        const newGrid = new Map(prev);
        newGrid.set(`${block.x},${block.y}`, block);
        return newGrid;
      });
    });

    // 4. Leaderboard Updates
    socket.on('leaderboard_update', (data) => {
      setLeaderboard(data);
    });

    // 5. Errors
    socket.on('error_message', (msg) => {
      alert(msg);
      setIsJoining(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('init_state');
      socket.off('player_info');
      socket.off('block_update');
      socket.off('leaderboard_update');
      socket.off('error_message');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinName.trim() || !isConnected) return;

    setIsJoining(true);
    socket.emit('join_game', joinName);
  };

  const handleBlockClick = (x, y) => {
    if (!isJoined) return;
    socket.emit('capture_block', { x, y });
  };

  // Zoom / Pan Logic
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(0.5, Math.min(3, z + delta)));
    }
  };

  const startPan = (e) => {
    if (e.button === 0) setIsPanning(true);
  };

  const doPan = (e) => {
    if (!isPanning) return;
    setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
  };

  const endPan = () => setIsPanning(false);

  // Stats
  const ownedBlocks = Array.from(grid.values()).filter(b => b.ownerId === myId).length;

  if (!isJoined) {
    return (
      <div className="login-screen">
        <div className="login-card-fx"></div> {/* Glow effect */}
        <div className="login-card">
          <h1>PIXEL<span className="accent">WARS</span></h1>
          <p className="subtitle">Claim your territory in real-time.</p>

          <form onSubmit={handleJoin}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter Codename"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                className="login-input"
                autoFocus
                maxLength={15}
                disabled={isJoining}
              />
            </div>

            <button
              type="submit"
              className={`login-btn ${!isConnected ? 'disabled' : ''}`}
              disabled={!isConnected || isJoining}
            >
              {!isConnected ? 'CONNECTING...' : isJoining ? 'ENTERING...' : 'JOIN BATTLE'}
            </button>
          </form>

          <div className="status-text">
            {isConnected ? <span className="online-dot">● Online</span> : <span className="offline-dot">● Connecting...</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-container"
      onWheel={handleWheel}
      onMouseUp={endPan}
      onMouseLeave={endPan}
    >
      <header>
        <h1 className="title">PIXEL<span className="accent">WARS</span></h1>

        <div className="status-bar">
          <div className="status-item">
            <div className="color-indicator" style={{ backgroundColor: myColor }}></div>
            <span className="value">{myName}</span>
          </div>
          <div className="status-item">
            <span className="label">SCORE</span>
            <span className="value">{ownedBlocks}</span>
          </div>
        </div>
      </header>

      {/* Leaderboard Panel */}
      <div className="leaderboard-panel">
        <h3>TOP AGENTS</h3>
        <ul>
          {leaderboard.length === 0 && <li className="empty">No active agents</li>}
          {leaderboard.map((user, i) => (
            <li key={i} className={user.name === myName ? 'me' : ''}>
              <span className="rank">#{i + 1}</span>
              <span className="name" style={{ color: user.color }}>{user.name}</span>
              <span className="score">{user.score}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.2))}>+</button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>-</button>
      </div>

      <main
        className="map-viewport"
        onMouseDown={startPan}
        onMouseMove={doPan}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          className="map-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          <Grid
            gridState={grid}
            size={GRID_SIZE}
            onBlockClick={handleBlockClick}
            myId={myId}
          />
        </div>
      </main>

      {isJoined && !isConnected && (
        <div className="connection-overlay">
          ⚠️ CONNECTION LOST
        </div>
      )}

      <footer>
        <p>Scroll/Drag to navigate • Click blocks to capture • 🔒 = Protected</p>
      </footer>
    </div>
  );
}

export default App;
