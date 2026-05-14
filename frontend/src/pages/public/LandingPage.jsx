import React, { useState, useEffect } from 'react';

export default function HaAidraLanding() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

    const handleClick = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', handleClick);
    });

    return () => {
      observer.disconnect();
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.removeEventListener('click', handleClick);
      });
    };
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="haaidra-landing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --navy: #0A1628;
          --deep-blue: #1D6FE8;
          --accent-teal: #00C2A8;
          --white: #ffffff;
          --gray-bg: #F8FAFB;
          --text-dark: #0A1628;
          --text-gray: #5A6578;
          --text-light: #94A3B8;
        }

        body {
          font-family: 'DM Sans', sans-serif;
          color: var(--text-dark);
          overflow-x: hidden;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Sora', sans-serif;
        }

        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        .fade-up.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        /* Navbar */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(10,22,40,0.06);
          height: 72px;
          display: flex;
          align-items: center;
        }

        .nav-container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 24px;
          color: var(--navy);
          text-decoration: none;
          letter-spacing: -0.5px;
        }

        .logo span {
          color: var(--deep-blue);
        }

        .nav-links {
          display: flex;
          gap: 40px;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--text-dark);
          font-weight: 500;
          font-size: 15px;
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: var(--deep-blue);
        }

        .nav-cta {
          background: var(--deep-blue);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .nav-cta:hover {
          background: #1557b8;
        }

        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px;
        }

        .hamburger span {
          display: block;
          width: 24px;
          height: 2px;
          background: var(--navy);
          transition: 0.3s;
          border-radius: 1px;
        }

        /* Hero */
        .hero {
          min-height: 100vh;
          background: var(--navy);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding-top: 72px;
        }

        .hero-glow {
          position: absolute;
          bottom: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(29,111,232,0.22) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          pointer-events: none;
        }

        .p1 { width: 6px; height: 6px; top: 20%; left: 15%; animation: float 10s ease-in-out infinite; }
        .p2 { width: 4px; height: 4px; top: 60%; left: 80%; animation: float 14s ease-in-out infinite 2s; }
        .p3 { width: 8px; height: 8px; top: 40%; left: 70%; animation: float 12s ease-in-out infinite 1s; }
        .p4 { width: 5px; height: 5px; top: 75%; left: 25%; animation: float 16s ease-in-out infinite 3s; }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }

        .hero-container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 0.65fr;
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(29,111,232,0.15);
          border: 1px solid rgba(29,111,232,0.3);
          color: #7EB3FF;
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
          font-family: 'DM Sans', sans-serif;
        }

        .hero-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--accent-teal);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-teal);
        }

        .hero h1 {
          font-size: 56px;
          line-height: 1.1;
          color: white;
          font-weight: 700;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .hero-sub {
          font-size: 18px;
          line-height: 1.6;
          color: #94A3B8;
          margin-bottom: 32px;
          max-width: 540px;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }

        .btn-primary {
          background: var(--deep-blue);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #1557b8;
          transform: translateY(-1px);
        }

        .btn-ghost {
          background: transparent;
          color: white;
          border: 1.5px solid rgba(255,255,255,0.3);
          padding: 14px 32px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-ghost:hover {
          border-color: white;
          background: rgba(255,255,255,0.05);
        }

        .hero-stats {
          display: flex;
          gap: 32px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: white;
        }

        .stat-label {
          font-size: 14px;
          color: #94A3B8;
        }

        /* Dashboard Mockup */
        .dashboard-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 28px;
          backdrop-filter: blur(10px);
          animation: cardFloat 6s ease-in-out infinite;
        }

        @keyframes cardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .dashboard-title {
          color: white;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
        }

        .dashboard-live {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--accent-teal);
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-teal);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }

        .gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
        }

        .gauge-svg {
          transform: rotate(-90deg);
        }

        .gauge-value {
          font-family: 'Sora', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: var(--accent-teal);
          margin-top: -56px;
          margin-bottom: 4px;
        }

        .gauge-label {
          font-size: 12px;
          color: #94A3B8;
          font-family: 'DM Sans', sans-serif;
        }

        .mini-chart {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 80px;
          margin-bottom: 24px;
          justify-content: center;
        }

        .chart-bar {
          width: 28px;
          background: var(--deep-blue);
          border-radius: 4px 4px 0 0;
          transition: opacity 0.2s;
        }

        .chart-bar:nth-child(1) { height: 65%; opacity: 0.5; }
        .chart-bar:nth-child(2) { height: 82%; opacity: 0.7; }
        .chart-bar:nth-child(3) { height: 71%; opacity: 0.6; }
        .chart-bar:nth-child(4) { height: 91%; opacity: 0.9; }
        .chart-bar:nth-child(5) { height: 76%; opacity: 0.6; }

        .transcript-box {
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 16px;
          font-size: 13px;
          line-height: 1.5;
          color: #CBD5E1;
          font-family: 'DM Sans', sans-serif;
        }

        .transcript-box .highlight {
          color: var(--accent-teal);
          font-weight: 600;
        }

        .transcript-box .highlight-blue {
          color: #7EB3FF;
          font-weight: 600;
        }

        /* Section common */
        .section {
          padding: 100px 24px;
        }

        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 40px;
          font-weight: 700;
          color: var(--navy);
          text-align: center;
          margin-bottom: 12px;
          font-family: 'Sora', sans-serif;
          letter-spacing: -0.5px;
        }

        .section-subtitle {
          font-size: 18px;
          color: var(--text-gray);
          text-align: center;
          max-width: 640px;
          margin: 0 auto 60px;
          line-height: 1.6;
          font-family: 'DM Sans', sans-serif;
        }

        /* How It Works */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          position: relative;
        }

        .step-card {
          text-align: center;
          position: relative;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: var(--deep-blue);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 18px;
          margin: 0 auto 20px;
        }

        .step-icon {
          font-size: 28px;
          margin-bottom: 12px;
          line-height: 1;
        }

        .step-title {
          font-family: 'Sora', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--navy);
          margin-bottom: 8px;
        }

        .step-desc {
          font-size: 15px;
          color: var(--text-gray);
          line-height: 1.6;
          font-family: 'DM Sans', sans-serif;
        }

        .connector-line {
          position: absolute;
          top: 24px;
          left: calc(50% + 24px);
          width: calc(100% - 48px);
          height: 2px;
          background: linear-gradient(90deg, var(--deep-blue), var(--accent-teal));
          opacity: 0.3;
        }

        /* Outcomes */
        .outcomes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .outcome-card {
          background: white;
          border: 1px solid rgba(10,22,40,0.08);
          border-radius: 12px;
          padding: 32px;
          transition: all 0.3s;
        }

        .outcome-card:hover {
          box-shadow: 0 12px 32px rgba(10,22,40,0.08);
          transform: translateY(-2px);
        }

        .outcome-icon {
          font-size: 32px;
          margin-bottom: 16px;
          line-height: 1;
        }

        .outcome-stat {
          font-family: 'Sora', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--navy);
          margin-bottom: 8px;
        }

        .outcome-desc {
          font-size: 15px;
          color: var(--text-gray);
          line-height: 1.6;
          font-family: 'DM Sans', sans-serif;
        }

        /* Why Choose Us */
        .why-grid {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: 60px;
          align-items: start;
        }

        .differentiators {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .diff-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .diff-check {
          width: 24px;
          height: 24px;
          background: rgba(0,194,168,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-teal);
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 2px;
          font-weight: 700;
        }

        .diff-text {
          font-size: 16px;
          color: var(--text-dark);
          line-height: 1.5;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
        }

        .comparison-table {
          background: white;
          border: 1px solid rgba(10,22,40,0.08);
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          background: var(--navy);
          color: white;
          padding: 16px 24px;
          font-weight: 600;
          font-size: 14px;
          font-family: 'Sora', sans-serif;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(10,22,40,0.06);
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:nth-child(even) {
          background: var(--gray-bg);
        }

        .check-cell {
          color: var(--accent-teal);
          font-weight: 700;
          text-align: center;
        }

        .cross-cell {
          color: #EF4444;
          font-weight: 700;
          text-align: center;
        }

        /* FAQ */
        .faq-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          background: white;
          border: 1px solid rgba(10,22,40,0.08);
          border-radius: 10px;
          overflow: hidden;
        }

        .faq-question {
          width: 100%;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--navy);
          cursor: pointer;
          text-align: left;
        }

        .faq-icon {
          font-size: 20px;
          color: var(--deep-blue);
          transition: transform 0.3s;
          flex-shrink: 0;
          margin-left: 16px;
          font-weight: 700;
        }

        .faq-item.open .faq-icon {
          transform: rotate(45deg);
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease-out, padding 0.4s;
        }

        .faq-item.open .faq-answer {
          max-height: 300px;
          padding: 0 24px 20px;
        }

        .faq-answer p {
          font-size: 15px;
          color: var(--text-gray);
          line-height: 1.7;
          font-family: 'DM Sans', sans-serif;
        }

        /* CTA Banner */
        .cta-banner {
          background: var(--navy);
          position: relative;
          overflow: hidden;
          padding: 100px 24px;
          text-align: center;
        }

        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(29,111,232,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .cta-banner h2 {
          font-size: 40px;
          color: white;
          margin-bottom: 16px;
          position: relative;
          z-index: 2;
          font-family: 'Sora', sans-serif;
          letter-spacing: -0.5px;
        }

        .cta-banner p {
          font-size: 18px;
          color: #94A3B8;
          margin-bottom: 32px;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 2;
          font-family: 'DM Sans', sans-serif;
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        /* Footer */
        .footer {
          background: var(--navy);
          padding: 60px 24px 0;
          color: white;
        }

        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .footer-brand .logo {
          color: white;
          margin-bottom: 12px;
          display: inline-block;
        }

        .footer-brand p {
          color: #94A3B8;
          font-size: 14px;
          line-height: 1.6;
          font-family: 'DM Sans', sans-serif;
        }

        .footer-col h4 {
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 20px;
        }

        .footer-col ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-col a {
          color: #94A3B8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .footer-col a:hover {
          color: white;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 0;
          text-align: center;
          color: #64748B;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .hamburger {
            display: flex;
          }

          .nav-links, .nav-container > .nav-cta {
            display: none;
          }

          .mobile-menu {
            position: fixed;
            top: 72px;
            left: 0;
            right: 0;
            background: white;
            border-bottom: 1px solid rgba(10,22,40,0.08);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            z-index: 999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }

          .mobile-menu a {
            text-decoration: none;
            color: var(--text-dark);
            font-weight: 500;
            font-size: 16px;
            padding: 8px 0;
            font-family: 'DM Sans', sans-serif;
          }

          .mobile-menu .nav-cta {
            display: block;
            width: 100%;
            text-align: center;
            margin-top: 8px;
          }

          .hero-container {
            grid-template-columns: 1fr;
            gap: 48px;
            text-align: center;
          }

          .hero h1 {
            font-size: 36px;
          }

          .hero-sub {
            margin-left: auto;
            margin-right: auto;
            font-size: 16px;
          }

          .hero-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }

          .hero-stats {
            justify-content: center;
            flex-wrap: wrap;
            gap: 24px;
          }

          .section-title {
            font-size: 30px;
          }

          .section-subtitle {
            font-size: 16px;
          }

          .steps-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .connector-line {
            display: none;
          }

          .outcomes-grid {
            grid-template-columns: 1fr;
          }

          .why-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .table-header, .table-row {
            grid-template-columns: 2fr 1fr 1fr;
            font-size: 13px;
            padding: 12px 16px;
          }

          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }

          .footer-brand {
            grid-column: 1 / -1;
          }

          .cta-banner h2 {
            font-size: 28px;
          }

          .cta-banner p {
            font-size: 16px;
          }

          .dashboard-card {
            padding: 20px;
          }
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="logo">ha<span>Ai</span>dra</a>
          <ul className="nav-links">
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#outcomes">Outcomes</a></li>
            <li><a href="#why-haaidra">Why haAidra</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <button className="nav-cta">Start Free Trial</button>
          <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        {mobileOpen && (
          <div className="mobile-menu">
            <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How It Works</a>
            <a href="#outcomes" onClick={() => setMobileOpen(false)}>Outcomes</a>
            <a href="#why-haaidra" onClick={() => setMobileOpen(false)}>Why haAidra</a>
            <a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
            <button className="nav-cta">Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
        <div className="particle p4"></div>
        <div className="hero-container">
          <div className="hero-content fade-up">
            <div className="hero-badge">AI-Powered Quality Assurance</div>
            <h1>Revolutionize Your Call Center QA</h1>
            <p className="hero-sub">
              Automate call analysis, score agent performance, and gain deep insights with haAidra's advanced AI pipeline. Built for modern support teams.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">Start Free Trial</button>
              <button className="btn-ghost">Watch Demo</button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">98%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">10x</span>
                <span className="stat-label">Faster Reviews</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">100%</span>
                <span className="stat-label">Call Coverage</span>
              </div>
            </div>
          </div>

          <div className="hero-visual fade-up">
            <div className="dashboard-card">
              <div className="dashboard-header">
                <span className="dashboard-title">Live QA Dashboard</span>
                <span className="dashboard-live">
                  <span className="live-dot"></span>
                  LIVE
                </span>
              </div>

              <div className="gauge-container">
                <svg className="gauge-svg" viewBox="0 0 140 140" width="140" height="140">
                  <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#00C2A8" strokeWidth="10"
                    strokeDasharray="343 365" strokeLinecap="round" />
                </svg>
                <div className="gauge-value">94%</div>
                <div className="gauge-label">QA Score</div>
              </div>

              <div className="mini-chart">
                <div className="chart-bar"></div>
                <div className="chart-bar"></div>
                <div className="chart-bar"></div>
                <div className="chart-bar"></div>
                <div className="chart-bar"></div>
              </div>

              <div className="transcript-box">
                <p>
                  Agent: "Thank you for calling support. I'd be happy to <span className="highlight">resolve</span> that for you today."<br /><br />
                  Customer: "I've been waiting for a <span className="highlight-blue">refund</span> for two weeks now."<br /><br />
                  Agent: "I sincerely <span className="highlight">apologize</span> for the delay. Let me check that immediately."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section" style={{ background: 'white' }}>
        <div className="section-container">
          <h2 className="section-title fade-up">What We Do & How</h2>
          <p className="section-subtitle fade-up">
            A fully automated AI pipeline that handles every step of call center quality assurance.
          </p>

          <div className="steps-grid fade-up">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🎙️</div>
              <h3 className="step-title">Ingest & Transcribe</h3>
              <p className="step-desc">Every call is captured and transcribed in real time with 98%+ accuracy.</p>
              <div className="connector-line"></div>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🧠</div>
              <h3 className="step-title">AI Analysis</h3>
              <p className="step-desc">Our NLP engine detects sentiment, compliance gaps, and behavioral patterns.</p>
              <div className="connector-line"></div>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">⚡</div>
              <h3 className="step-title">Auto Scoring</h3>
              <p className="step-desc">Agents are scored against your custom rubrics automatically, at scale.</p>
              <div className="connector-line"></div>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">📊</div>
              <h3 className="step-title">Actionable Insights</h3>
              <p className="step-desc">Managers receive dashboards, alerts, and coaching recommendations instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section id="outcomes" className="section" style={{ background: '#F8FAFB' }}>
        <div className="section-container">
          <h2 className="section-title fade-up">Outcomes We Deliver</h2>
          <p className="section-subtitle fade-up">
            Measurable business impact from day one.
          </p>

          <div className="outcomes-grid fade-up">
            <div className="outcome-card">
              <div className="outcome-icon">📈</div>
              <div className="outcome-stat">10x Faster QA</div>
              <p className="outcome-desc">Review 100% of calls instead of a 2% sample — in a fraction of the time.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">🎯</div>
              <div className="outcome-stat">98% Scoring Accuracy</div>
              <p className="outcome-desc">AI scores match or exceed human evaluator consistency.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">💬</div>
              <div className="outcome-stat">Real-Time Feedback</div>
              <p className="outcome-desc">Agents receive post-call coaching without waiting for manual review.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">🔒</div>
              <div className="outcome-stat">Compliance Assurance</div>
              <p className="outcome-desc">Automatically flag regulatory risks and script deviations.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">📊</div>
              <div className="outcome-stat">Deep Analytics</div>
              <p className="outcome-desc">Trend analysis, sentiment heatmaps, and performance benchmarks.</p>
            </div>
            <div className="outcome-card">
              <div className="outcome-icon">💰</div>
              <div className="outcome-stat">Reduce QA Costs</div>
              <p className="outcome-desc">Cut manual QA overhead by up to 70% while improving coverage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-haaidra" className="section" style={{ background: 'white' }}>
        <div className="section-container">
          <h2 className="section-title fade-up">Why Choose haAidra</h2>
          <p className="section-subtitle fade-up">
            Built differently. Engineered for enterprise-grade call center operations.
          </p>

          <div className="why-grid fade-up">
            <div className="differentiators">
              <div className="diff-item">
                <div className="diff-check">✓</div>
                <span className="diff-text">Purpose-built for call centers — not a generic AI tool</span>
              </div>
              <div className="diff-item">
                <div className="diff-check">✓</div>
                <span className="diff-text">No-code rubric builder — customize scoring in minutes</span>
              </div>
              <div className="diff-item">
                <div className="diff-check">✓</div>
                <span className="diff-text">CRM & telephony integrations — Salesforce, Zendesk, Twilio, Genesys</span>
              </div>
              <div className="diff-item">
                <div className="diff-check">✓</div>
                <span className="diff-text">SOC 2 Type II certified — enterprise security by design</span>
              </div>
              <div className="diff-item">
                <div className="diff-check">✓</div>
                <span className="diff-text">Dedicated onboarding & success team</span>
              </div>
            </div>

            <div className="comparison-table">
              <div className="table-header">
                <div>Feature</div>
                <div style={{ textAlign: 'center' }}>haAidra ✓</div>
                <div style={{ textAlign: 'center' }}>Traditional QA ✗</div>
              </div>
              <div className="table-row">
                <div>Call Coverage</div>
                <div className="check-cell">100%</div>
                <div className="cross-cell">~2%</div>
              </div>
              <div className="table-row">
                <div>Scoring Speed</div>
                <div className="check-cell">Real-time</div>
                <div className="cross-cell">Days</div>
              </div>
              <div className="table-row">
                <div>Human Bias</div>
                <div className="check-cell">Eliminated</div>
                <div className="cross-cell">High</div>
              </div>
              <div className="table-row">
                <div>Cost</div>
                <div className="check-cell">70% less</div>
                <div className="cross-cell">Expensive</div>
              </div>
              <div className="table-row">
                <div>Scalability</div>
                <div className="check-cell">Unlimited</div>
                <div className="cross-cell">Limited</div>
              </div>
              <div className="table-row">
                <div>Real-time Feedback</div>
                <div className="check-cell">✓</div>
                <div className="cross-cell">✗</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section" style={{ background: '#F8FAFB' }}>
        <div className="section-container">
          <h2 className="section-title fade-up">Frequently Asked Questions</h2>
          <p className="section-subtitle fade-up">
            Everything you need to know before getting started.
          </p>

          <div className="faq-list fade-up">
            {[
              {
                q: "How does haAidra integrate with our existing call center software?",
                a: "haAidra connects natively with leading telephony and CRM platforms including Twilio, Genesys, Five9, Salesforce, and Zendesk via pre-built connectors and REST APIs. Most teams are live within 48 hours."
              },
              {
                q: "How accurate is the AI transcription and scoring?",
                a: "Our transcription engine achieves 98%+ accuracy across English and 12 other languages. Scoring alignment with human evaluators consistently exceeds 96% on standard QA rubrics."
              },
              {
                q: "Can we customize the QA scoring rubrics?",
                a: "Yes. haAidra includes a no-code rubric builder that lets QA managers define criteria, weights, and thresholds without any engineering involvement."
              },
              {
                q: "Is haAidra compliant with data privacy regulations?",
                a: "haAidra is SOC 2 Type II certified and fully compliant with GDPR, HIPAA, and CCPA. All call data is encrypted at rest and in transit."
              },
              {
                q: "How long does onboarding take?",
                a: "Most customers are fully onboarded within 5–7 business days. Our dedicated success team handles integration setup, rubric configuration, and team training."
              },
              {
                q: "What kind of support is included?",
                a: "All plans include 24/7 technical support, a dedicated customer success manager, and access to our online knowledge base and training portal."
              }
            ].map((item, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(i)}>
                  {item.q}
                  <span className="faq-icon">+</span>
                </button>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="cta-glow"></div>
        <h2 className="fade-up">Ready to Transform Your QA Operations?</h2>
        <p className="fade-up">Join hundreds of support teams already using haAidra to automate quality assurance.</p>
        <div className="cta-buttons fade-up">
          <button className="btn-primary">Start Free Trial</button>
          <button className="btn-ghost">Schedule a Demo</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#" className="logo">ha<span>Ai</span>dra</a>
            <p>Revolutionize Your Call Center QA with AI-powered automation and deep analytics.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Integrations</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2025 haAidra. All rights reserved.
        </div>
      </footer>
    </div>
  );
}