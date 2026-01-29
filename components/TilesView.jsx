import Link from 'next/link';

export default function TilesView({ items }) {
  if (!items || items.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No items to display.</p>;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px'
    }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'block',
            textDecoration: 'none',
            color: 'var(--text-color)',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {item.imageSrc ? (
            <div style={{
              width: '100%',
              height: '160px',
              overflow: 'hidden',
              backgroundColor: 'var(--border-color)'
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
              width: '100%',
              height: '160px',
              backgroundColor: 'var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
          )}
          <div style={{
            padding: '16px',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.1rem',
            fontWeight: 600
          }}>
            {item.title}
          </div>
        </Link>
      ))}
    </div>
  );
}
