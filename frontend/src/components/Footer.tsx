export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__brand">Rotary Management</span>
        <span className="footer__meta">
          © {year} Rotary Club dashboard. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

