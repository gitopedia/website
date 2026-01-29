import Link from 'next/link';

export default function Privacy() {
  return (
    <main style={{ 
      width: 'min(95%, max(70%, calc(100% - 40vw + 200px)))', 
      maxWidth: 1800, 
      margin: '40px auto', 
      padding: '0 24px',
      fontFamily: "'Source Serif 4', Georgia, serif",
      lineHeight: 1.7
    }}>
      <nav style={{ marginBottom: 24 }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'var(--link-color)' }}>← Back to Home</Link>
      </nav>

      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>Privacy Policy</h1>
      
      <p><strong>Effective Date:</strong> January 30, 2026</p>
      
      <p>
        Gitopedia ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
        how we collect, use, and safeguard information when you visit our website.
      </p>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Information We Collect</h2>
      
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Automatically Collected Information</h3>
      <p>When you visit Gitopedia, we may automatically collect certain information, including:</p>
      <ul>
        <li><strong>Usage Data:</strong> Pages visited, time spent on pages, and navigation paths</li>
        <li><strong>Device Information:</strong> Browser type, operating system, and screen resolution</li>
        <li><strong>Network Information:</strong> IP address (anonymized where possible) and approximate geographic location</li>
      </ul>
      
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Information We Do Not Collect</h3>
      <p>We do not:</p>
      <ul>
        <li>Require user registration or accounts</li>
        <li>Collect personal identification information (name, email, phone number)</li>
        <li>Store payment or financial information</li>
        <li>Use tracking cookies for advertising purposes</li>
      </ul>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>How We Use Information</h2>
      <p>We use collected information solely for:</p>
      <ul>
        <li>Understanding how visitors use our website to improve content and user experience</li>
        <li>Analyzing aggregate traffic patterns and trends</li>
        <li>Maintaining and securing our website infrastructure</li>
        <li>Detecting and preventing abuse or unauthorized access</li>
      </ul>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Cookies and Tracking</h2>
      <p>We use minimal cookies necessary for website functionality:</p>
      <ul>
        <li><strong>Preference Cookies:</strong> To remember your theme preference (light/dark/reader mode) and text size settings</li>
        <li><strong>Analytics Cookies:</strong> If enabled, we may use privacy-respecting analytics to understand aggregate usage patterns</li>
      </ul>
      <p>
        You can control cookie settings through your browser. Disabling cookies may affect some features 
        (such as theme preference persistence).
      </p>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Third-Party Services</h2>
      <p>
        We may use third-party services for analytics (such as Google Analytics). These services may collect 
        information sent by your browser as part of a web page request. Their use of this information is 
        governed by their respective privacy policies.
      </p>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Data Retention</h2>
      <p>
        Analytics data is retained only as long as necessary for the purposes outlined above. We do not 
        maintain long-term profiles of individual visitors.
      </p>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Data Security</h2>
      <p>
        We implement reasonable technical and organizational measures to protect information from unauthorized 
        access, alteration, disclosure, or destruction. However, no internet transmission is completely secure.
      </p>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access information we hold about you</li>
        <li>Request deletion of your data</li>
        <li>Opt out of analytics tracking</li>
        <li>Lodge a complaint with a supervisory authority</li>
      </ul>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Children's Privacy</h2>
      <p>
        Gitopedia is a general-audience educational resource. We do not knowingly collect personal information 
        from children under 13. If you believe we have inadvertently collected such information, please 
        contact us for removal.
      </p>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>International Users</h2>
      <p>
        Gitopedia is accessible worldwide. By using our website, you consent to the transfer of information 
        to countries that may have different data protection laws than your country of residence.
      </p>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy periodically. Changes will be posted on this page with an updated 
        effective date. Your continued use of Gitopedia after changes constitutes acceptance of the updated policy.
      </p>
      
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}>Contact Us</h2>
      <p>
        For privacy-related inquiries or to exercise your rights, please open an issue on our GitHub repository 
        at <a href="https://github.com/Gitopedia/gitopedia" target="_blank" rel="noopener noreferrer">
        github.com/Gitopedia/gitopedia</a>.
      </p>

      <footer style={{ 
        marginTop: 40, 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: 20, 
        color: 'var(--text-muted)', 
        fontSize: '0.8rem', 
        textAlign: 'center' 
      }}>
        <p>
          <Link href="/license" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>License</Link>
          {' · '}
          <Link href="/terms" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Terms of Use</Link>
          {' · '}
          <Link href="/privacy" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </footer>
    </main>
  );
}
