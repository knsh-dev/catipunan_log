// client/src/components/TopBar.jsx
import '../styles/TopBar.css';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);

export default function TopBar({ title, user, onRefresh }) {
  const initial = user?.full_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-right">
        <div className="topbar-search">
          <SearchIcon />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search"
            readOnly
          />
        </div>

        <button className="topbar-icon-btn" onClick={onRefresh} title="Refresh data">
          <RefreshIcon />
        </button>

        <div className="topbar-avatar">{initial}</div>
      </div>
    </div>
  );
}
