import { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';

export default function App({ Component, pageProps }) {
  // Theme: 'light', 'dark', or 'reader'
  const [theme, setTheme] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [textSize, setTextSize] = useState(17); // Base text size in px

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedTextSize = localStorage.getItem('textSize');
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to reader mode
      setTheme('reader');
    }
    
    if (savedTextSize) {
      setTextSize(parseInt(savedTextSize, 10));
    }
    
    setMounted(true);
  }, []);

  // Save preferences and apply to document
  useEffect(() => {
    if (theme !== null) {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('textSize', textSize);
    document.documentElement.style.setProperty('--article-font-size', `${textSize}px`);
  }, [textSize]);

  // Cycle through themes: light -> reader -> dark -> light
  const cycleTheme = () => {
    if (theme === 'light') setTheme('reader');
    else if (theme === 'reader') setTheme('dark');
    else setTheme('light');
  };

  // Text size controls
  const increaseTextSize = () => setTextSize(prev => Math.min(prev + 2, 28));
  const decreaseTextSize = () => setTextSize(prev => Math.max(prev - 2, 12));

  // Determine header background color based on theme
  const getHeaderBgColor = () => {
    if (theme === 'dark') return '#1a1a1a';
    if (theme === 'reader') return '#5c4a3a';
    return '#4a4a4a';
  };

  // Get theme icon and label
  const getThemeInfo = () => {
    if (theme === 'dark') {
      return {
        label: 'Dark',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )
      };
    }
    if (theme === 'reader') {
      return {
        label: 'Reader',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        )
      };
    }
    return {
      label: 'Light',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      )
    };
  };

  const themeInfo = getThemeInfo();

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Google Fonts - Source Serif 4 + Playfair Display */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,500;0,600;1,400&display=swap" 
          rel="stylesheet" 
        />
        {/* KaTeX CSS for math rendering */}
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" 
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" 
          crossOrigin="anonymous"
        />
      </Head>
      
      {/* Inline script to prevent flash - runs before React hydrates */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var savedTheme = localStorage.getItem('theme');
                var theme = savedTheme || 'reader';
                document.documentElement.setAttribute('data-theme', theme);
                var savedTextSize = localStorage.getItem('textSize');
                if (savedTextSize) {
                  document.documentElement.style.setProperty('--article-font-size', savedTextSize + 'px');
                }
              } catch (e) {}
            })();
          `,
        }}
      />
      
      <style jsx global>{`
        :root {
          --bg-color: #ffffff;
          --text-color: #1a1a1a;
          --text-muted: #666666;
          --border-color: #eeeeee;
          --link-color: #0066cc;
          --header-bg: #4a4a4a;
          --article-font-size: 17px;
        }
        [data-theme="dark"] {
          --bg-color: #1a1a1a;
          --text-color: #e8e8e8;
          --text-muted: #999999;
          --border-color: #333333;
          --link-color: #5ca8ff;
          --header-bg: #1a1a1a;
        }
        [data-theme="reader"] {
          --bg-color: #f5efe6;
          --text-color: #3d3229;
          --text-muted: #6b5d4d;
          --border-color: #d4c9b9;
          --link-color: #8b5a2b;
          --header-bg: #5c4a3a;
        }
        html, body {
          margin: 0;
          padding: 0;
          background-color: var(--bg-color);
          color: var(--text-color);
          transition: background-color 0.2s, color 0.2s;
        }
        a {
          color: var(--link-color);
        }
        input, button {
          background-color: var(--bg-color);
          color: var(--text-color);
          border: 1px solid var(--border-color);
        }
        button {
          cursor: pointer;
        }
        button:hover {
          opacity: 0.9;
        }
        
        /* References section styling */
        article .references {
          margin-top: 3em;
          padding-top: 1.5em;
          border-top: 2px solid var(--border-color);
        }
        article .references h2 {
          font-size: 1.4em;
          margin-bottom: 0.75em;
        }
        article .references ol {
          padding-left: 1.5em;
          list-style-type: decimal;
          margin: 0;
        }
        article .references ol li {
          display: list-item;
          margin-bottom: 0.4em;
          padding-left: 0.25em;
          line-height: 1.5;
        }
        article .references a {
          word-break: break-all;
        }
        /* Footnote reference links in text */
        article sup a {
          font-size: 0.85em;
          color: var(--link-color);
          text-decoration: none;
          padding: 0 1px;
        }
        article sup a:hover {
          text-decoration: underline;
        }
        /* General list styling */
        article ol li,
        article ul li {
          margin-bottom: 0.5em;
        }
        
        /* Responsive content width - prevent horizontal scroll */
        article {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        article pre {
          overflow-x: auto;
          max-width: 100%;
        }
        article img {
          max-width: 100%;
          height: auto;
        }
        
        /* KaTeX responsive */
        .katex-display {
          overflow-x: auto;
          overflow-y: hidden;
          max-width: 100%;
        }
        .katex {
          font-size: 1.1em;
        }
        
        /* Page Typography - Source Serif 4 + Playfair Display */
        main {
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: var(--article-font-size);
          line-height: 1.7;
        }
        main h1, main h2, main h3, main h4, main h5, main h6 {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        main h1 {
          margin-top: 0;
        }
        main h2 {
          font-size: 1.75em;
        }
        main h3 {
          font-size: 1.4em;
        }
        main p {
          margin-bottom: 1.2em;
        }
        main blockquote {
          border-left: 3px solid var(--link-color);
          margin-left: 0;
          padding-left: 20px;
          font-style: italic;
          opacity: 0.9;
        }
        main code {
          font-size: 0.9em;
          background: rgba(128,128,128,0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        /* Article-specific typography overrides */
        article {
          font-family: 'Source Serif 4', Georgia, serif;
          font-size: var(--article-font-size);
          line-height: 1.7;
        }
        article h1, article h2, article h3, article h4, article h5, article h6 {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        article h2 {
          font-size: 1.75em;
        }
        article h3 {
          font-size: 1.4em;
        }
        article p {
          margin-bottom: 1.2em;
        }
        article blockquote {
          border-left: 3px solid var(--link-color);
          margin-left: 0;
          padding-left: 20px;
          font-style: italic;
          opacity: 0.9;
        }
        article code {
          font-size: 0.9em;
          background: rgba(128,128,128,0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>

      {/* Top Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: mounted ? getHeaderBgColor() : 'var(--header-bg)',
        padding: 'clamp(8px, 2vw, 12px) 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.2s'
      }}>
        {/* Site Icon / Logo */}
        <Link href="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          textDecoration: 'none',
          color: '#fff'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span style={{ 
            fontWeight: 700, 
            fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
            fontFamily: '"DM Sans", "Outfit", "Sora", system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.02em'
          }}>Gitopedia</span>
        </Link>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Text Size Controls */}
          <button
            onClick={decreaseTextSize}
            style={{
              background: 'transparent',
              border: '1px solid #666',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1
            }}
            aria-label="Decrease text size"
            title="Decrease text size"
          >
            A−
          </button>
          <button
            onClick={increaseTextSize}
            style={{
              background: 'transparent',
              border: '1px solid #666',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1
            }}
            aria-label="Increase text size"
            title="Increase text size"
          >
            A+
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            style={{
              background: 'transparent',
              border: '1px solid #666',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#fff',
              fontSize: '0.9rem',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            aria-label="Toggle theme"
          >
            {themeInfo.icon}
            {themeInfo.label}
          </button>
        </div>
      </header>

      {process.env.NEXT_PUBLIC_ANALYTICS_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_ANALYTICS_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_ANALYTICS_ID}');
            `}
          </Script>
        </>
      )}
      <Component {...pageProps} />
    </>
  );
}
