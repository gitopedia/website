import Link from 'next/link';

export default function RowsView({ items }) {
  if (!items || items.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No items to display.</p>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'flex',
            textDecoration: 'none',
            color: 'var(--text-color)',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {item.imageSrc ? (
            <div style={{
              width: '200px',
              minWidth: '200px',
              height: '120px',
              overflow: 'hidden',
              backgroundColor: 'var(--border-color)',
              flexShrink: 0
            }}>
              <img
                src={item.imageSrc}
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            </div>
          ) : (
            <div style={{
              width: '200px',
              minWidth: '200px',
              height: '120px',
              backgroundColor: 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
          )}
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.25rem',
            fontWeight: 600
          }}>
            {item.title}
          </div>
        </Link>
      ))}
    </div>
  );
}
