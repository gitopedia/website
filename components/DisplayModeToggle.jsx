import { useState, useEffect } from 'react';

const MODES = ['list', 'tiles', 'rows'];

const ICONS = {
  list: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  ),
  tiles: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  rows: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="5" rx="1"></rect>
      <rect x="3" y="10" width="18" height="5" rx="1"></rect>
      <rect x="3" y="17" width="18" height="5" rx="1"></rect>
    </svg>
  )
};

const LABELS = {
  list: 'List',
  tiles: 'Tiles',
  rows: 'Rows'
};

export default function DisplayModeToggle({ storageKey = 'displayMode', onChange }) {
  const [mode, setMode] = useState('tiles');

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved && MODES.includes(saved)) {
      setMode(saved);
      if (onChange) onChange(saved);
    } else {
      // Default to tiles if nothing saved
      if (onChange) onChange('tiles');
    }
  }, [storageKey]);

  const cycleMode = () => {
    const currentIndex = MODES.indexOf(mode);
    const nextIndex = (currentIndex + 1) % MODES.length;
    const nextMode = MODES[nextIndex];
    setMode(nextMode);
    localStorage.setItem(storageKey, nextMode);
    if (onChange) onChange(nextMode);
  };

  return (
    <button
      onClick={cycleMode}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: 'var(--bg-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        color: 'var(--text-color)',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      title={`Switch to ${LABELS[MODES[(MODES.indexOf(mode) + 1) % MODES.length]]} view`}
    >
      {ICONS[mode]}
      {LABELS[mode]}
    </button>
  );
}

export { MODES };
