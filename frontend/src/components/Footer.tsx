export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand-row">
          <span className="footer__logo-circle" />
          <div className="footer__brand-text">
            <span className="footer__brand">Rotary Club</span>
            <span className="footer__contact">Contact Information</span>
          </div>
        </div>
        <div className="footer__socials">
          <span className="footer__social-circle" />
          <span className="footer__social-circle" />
          <span className="footer__social-circle" />
        </div>
      </div>
    </footer>
  );
}