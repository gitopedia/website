import Link from 'next/link';

export default function ListView({ items }) {
  if (!items || items.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No items to display.</p>;
  }

  return (
    <ul style={{ 
      listStyle: 'disc',
      paddingLeft: '1.5em',
      margin: 0
    }}>
      {items.map((item) => (
        <li key={item.href} style={{ marginBottom: '8px' }}>
          <Link 
            href={item.href} 
            style={{ 
              color: 'var(--link-color)', 
              textDecoration: 'none' 
            }}
          >
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
