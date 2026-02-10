import React from 'react';

const Grid = ({ gridState, size, onBlockClick, myId }) => {
    // Create an array of size*size to render
    const blocks = [];

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const key = `${x},${y}`;
            const block = gridState.get(key);
            const isOwnedByMe = block?.ownerId === myId;
            const now = Date.now();
            const isLocked = block?.lockedUntil > now;

            blocks.push(
                <div
                    key={key}
                    className={`grid-block ${block ? 'occupied' : ''} ${isOwnedByMe ? 'mine' : ''} ${isLocked ? 'locked' : ''}`}
                    style={{
                        '--block-color': block?.color || 'transparent',
                        '--delay': `${(x + y) * 10}ms` // stagger animation
                    }}
                    onClick={() => onBlockClick(x, y)}
                    title={isLocked ? "Locked!" : `x:${x}, y:${y}`}
                >
                    {/* Inner content for effects */}
                    <div className="block-inner">
                        {isLocked && <span className="lock-icon">🔒</span>}
                    </div>
                </div>
            );
        }
    }

    return (
        <div
            className="grid-container"
            style={{
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                gridTemplateRows: `repeat(${size}, 1fr)`
            }}
        >
            {blocks}
        </div>
    );
};

export default Grid;
