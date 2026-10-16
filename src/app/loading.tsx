export default function Loading() {
  return (
    <div className="shell" aria-busy="true" aria-label="Loading control panel">
      <aside className="sidebar skeleton-sidebar">
        <div className="skeleton skeleton-brand" />
        <div className="skeleton-nav" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="skeleton skeleton-nav-item" key={index} />
          ))}
        </div>
        <div className="skeleton skeleton-sidebar-note" />
      </aside>
      <main className="main loading-main">
        <div className="loading-heading">
          <div><div className="skeleton skeleton-eyebrow" /><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /></div>
          <div className="skeleton skeleton-action" />
        </div>
        <div className="loading-stats">
          <div className="skeleton skeleton-stat" />
          <div className="skeleton skeleton-stat" />
          <div className="skeleton skeleton-stat" />
          <div className="skeleton skeleton-stat" />
        </div>
        <div className="loading-content">
          <div className="skeleton skeleton-panel" />
          <div className="skeleton skeleton-panel" />
        </div>
      </main>
    </div>
  );
}
