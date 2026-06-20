'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: '📊',
    title: 'Smart Dashboard',
    desc: 'Real-time overview of your income, expenses, balance, and savings with interactive charts.',
    color: '#10B981',
  },
  {
    icon: '🤖',
    title: 'AI Scanner',
    desc: 'Snap a receipt or upload a document — our AI extracts and logs transactions automatically.',
    color: '#6366F1',
  },
  {
    icon: '🛡️',
    title: 'Fraud Detection',
    desc: 'AI-powered anomaly detection that flags suspicious transactions before they hurt your business.',
    color: '#F43F5E',
  },
  {
    icon: '📋',
    title: 'Full Accounting Suite',
    desc: 'General journal, ledger, trial balance, income statement, and balance sheet — all automated.',
    color: '#F59E0B',
  },
  {
    icon: '🎯',
    title: 'Budget Tracking',
    desc: 'Set monthly budgets per category and track spending in real time with visual progress bars.',
    color: '#EC4899',
  },
  {
    icon: '📈',
    title: 'Financial Reports',
    desc: 'Export professional PDF reports ready for stakeholders, auditors, or tax season.',
    color: '#14B8A6',
  },
];

const stats = [
  { value: '50K+', label: 'Transactions Tracked' },
  { value: '99.9%', label: 'Uptime Guaranteed' },
  { value: '10x', label: 'Faster Bookkeeping' },
  { value: '100%', label: 'Data Encrypted' },
];

const testimonials = [
  {
    name: 'Rina Sari',
    role: 'Small Business Owner',
    avatar: 'R',
    color: '#10B981',
    text: 'KasFlow transformed how I manage my café finances. The AI scanner saves me hours every week!',
  },
  {
    name: 'Budi Santoso',
    role: 'Freelance Accountant',
    avatar: 'B',
    color: '#6366F1',
    text: 'The automated journal entries and balance sheets are incredibly accurate. My clients love the reports.',
  },
  {
    name: 'Dewi Rahayu',
    role: 'Startup CFO',
    avatar: 'D',
    color: '#F43F5E',
    text: 'Fraud detection caught a suspicious pattern in our accounts. Saved us millions. Game changer.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="landing-root">
      {/* ── Navbar ── */}
      <nav className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">💰</div>
            <span className="landing-logo-text">KasFlow</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#stats" className="landing-nav-link">Stats</a>
            <a href="#testimonials" className="landing-nav-link">Testimonials</a>
          </div>
          <div className="landing-nav-actions">
            {user ? (
              <Link href="/dashboard" className="landing-btn landing-btn-primary">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="landing-btn landing-btn-ghost">Login</Link>
                <Link href="/signup" className="landing-btn landing-btn-primary">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-bg-orb orb-1" />
        <div className="hero-bg-orb orb-2" />
        <div className="hero-bg-orb orb-3" />

        <div className="landing-container hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            AI-Powered Financial Intelligence
          </div>
          <h1 className="hero-title">
            Manage Your Money
            <span className="hero-title-gradient"> Like a Pro</span>
            <br />with KasFlow
          </h1>
          <p className="hero-subtitle">
            The all-in-one accounting platform powered by AI. Track spending, detect fraud, automate bookkeeping, 
            and generate financial reports — all from one beautiful dashboard.
          </p>
          <div className="hero-cta-group">
            {user ? (
              <Link href="/dashboard" className="landing-btn landing-btn-primary landing-btn-lg">
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/signup" className="landing-btn landing-btn-primary landing-btn-lg">
                  🚀 Start for Free
                </Link>
                <Link href="/login" className="landing-btn landing-btn-outline landing-btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>
          <p className="hero-note">No credit card required · Free forever for personal use</p>

          {/* Hero dashboard preview */}
          <div className="hero-preview">
            <div className="hero-preview-bar">
              <span className="preview-dot" style={{ background: '#F43F5E' }} />
              <span className="preview-dot" style={{ background: '#F59E0B' }} />
              <span className="preview-dot" style={{ background: '#10B981' }} />
              <span className="preview-title">KasFlow Dashboard</span>
            </div>
            <div className="hero-preview-body">
              <div className="preview-sidebar">
                {['📊', '🤖', '💬', '💳', '📈', '🎯', '🏦'].map((icon, i) => (
                  <div key={i} className={`preview-nav-item ${i === 0 ? 'preview-nav-active' : ''}`}>
                    {icon}
                  </div>
                ))}
              </div>
              <div className="preview-main">
                <div className="preview-stats-row">
                  {[
                    { label: 'Balance', val: 'Rp 124.5M', color: '#10B981' },
                    { label: 'Income', val: 'Rp 45.2M', color: '#10B981' },
                    { label: 'Expenses', val: 'Rp 18.7M', color: '#F43F5E' },
                    { label: 'Savings', val: 'Rp 26.5M', color: '#6366F1' },
                  ].map((s, i) => (
                    <div key={i} className="preview-stat-card">
                      <div className="preview-stat-label">{s.label}</div>
                      <div className="preview-stat-value" style={{ color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div className="preview-chart-row">
                  <div className="preview-chart">
                    <div className="preview-chart-label">Cashflow Chart</div>
                    <div className="preview-chart-bars">
                      {[60, 80, 45, 90, 70, 85, 55, 75, 95, 65, 80, 70].map((h, i) => (
                        <div key={i} className="preview-bar-group">
                          <div className="preview-bar preview-bar-income" style={{ height: `${h}%` }} />
                          <div className="preview-bar preview-bar-expense" style={{ height: `${h * 0.5}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="preview-donut">
                    <div className="preview-chart-label">By Category</div>
                    <div className="preview-donut-visual">
                      <div className="preview-donut-ring" />
                      <div className="preview-donut-center">72%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="landing-section landing-section-dark" data-animate>
        <div
          className={`landing-container stats-section ${isVisible('stats') ? 'section-visible' : 'section-hidden'}`}
        >
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-item-value">{s.value}</div>
              <div className="stat-item-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section" data-animate>
        <div className="landing-container">
          <div id="features-header" data-animate className={`section-header ${isVisible('features-header') ? 'section-visible' : 'section-hidden'}`}>
            <div className="section-badge">Everything You Need</div>
            <h2 className="section-title">Powerful Features, <span className="section-title-accent">Simple Interface</span></h2>
            <p className="section-subtitle">
              From AI-powered scanning to professional accounting reports — KasFlow has every tool your business needs.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div
                key={i}
                id={`feature-${i}`}
                data-animate
                className={`feature-card ${isVisible(`feature-${i}`) ? 'section-visible' : 'section-hidden'}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="feature-icon" style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="feature-line" style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="landing-section landing-section-dark" data-animate>
        <div className="landing-container">
          <div id="testimonials-header" data-animate className={`section-header ${isVisible('testimonials-header') ? 'section-visible' : 'section-hidden'}`}>
            <div className="section-badge">Real Stories</div>
            <h2 className="section-title">Loved by <span className="section-title-accent">Thousands</span></h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div
                key={i}
                id={`testimonial-${i}`}
                data-animate
                className={`testimonial-card ${isVisible(`testimonial-${i}`) ? 'section-visible' : 'section-hidden'}`}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: `${t.color}22`, color: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section landing-cta-section">
        <div className="cta-bg-orb cta-orb-1" />
        <div className="cta-bg-orb cta-orb-2" />
        <div className="landing-container cta-content">
          <h2 className="cta-title">Ready to Take Control of Your Finances?</h2>
          <p className="cta-subtitle">Join thousands of businesses already using KasFlow to manage their money smarter.</p>
          <div className="hero-cta-group">
            {user ? (
              <Link href="/dashboard" className="landing-btn landing-btn-primary landing-btn-lg">
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/signup" className="landing-btn landing-btn-primary landing-btn-lg">
                  🚀 Get Started Free
                </Link>
                <Link href="/login" className="landing-btn landing-btn-outline landing-btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">💰</div>
            <span className="landing-logo-text">KasFlow</span>
          </div>
          <p className="footer-copy">© 2026 KasFlow · Built by LB53 Kelompok 10 · Binus University</p>
          <div className="footer-links">
            <a href="#features" className="footer-link">Features</a>
            <a href="#stats" className="footer-link">Stats</a>
            <a href="#testimonials" className="footer-link">Reviews</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
