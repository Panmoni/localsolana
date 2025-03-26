import React from 'react';
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-section flex items-center justify-center text-center">
            <div className="footer-nav flex flex-col items-center">
            <Link to="/" className="text-2xl text-purple-700 flex items-center gap-2">
              <img src="/logo.png" alt="LocalSolana Logo" className="h-8 w-auto mb-6" />
              <h4 className="font-black text-purple-800 mb-6">LocalSolana</h4>
            </Link>
            <p className="text-sm">Buy and sell USDC on Solana P2P anywhere, anyhow</p>
          </div>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Quick Links</h3>
          <nav className="footer-nav">
            <a target="_blank" href="https://LocalSolana.com/">Features</a>
            <a href="">Documentation</a>
            <a href="">Support</a>
            <a target="_blank" href="https://LocalSolana.com/blog">Blog</a>
          </nav>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Legal</h3>
          <nav className="footer-nav">
            <a target="_blank" href="https://LocalSolana.com/terms">Terms of Service</a>
            <a target="_blank" href="https://LocalSolana.com/privacy">Privacy Policy</a>
            <a target="_blank" href="https://localsolana.com/disclaimer">Disclaimer</a>
            <a target="_blank" href="">Cookie Policy</a>
          </nav>
        </div>

        <div className="footer-section">
          <h3 className="footer-title">Connect</h3>
          <p>
            <a className="!font-normal" href="mailto:hello@panmoni.com">hello@panmoni.com</a>
          </p>
          <div className="social-links">
            <a
              href="https://x.com/localsolana"
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>
            <a
              href="https://github.com/Panmoni/localsolana"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://t.me/Panmoni/802"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="mb-2">The best place for discussion and support is our <a href="https://t.me/Panmoni/802" target='_blank'>Telegram</a> group.</p>
        <p className="mb-2">También hay soporte en Español en <a href="https://t.me/Panmoni/8042" target='_blank'>Telegram</a>.</p>
        <p className="mb-2">&copy; {new Date().getFullYear()} A <a className="panmoni-link" href="https://panmoni.com" target='_blank'>Panmoni</a> project</p>
      </div>
    </footer>
  );
};

export default Footer;
