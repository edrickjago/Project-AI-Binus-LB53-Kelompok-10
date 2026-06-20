'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const { signup, user, isLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  const getPasswordStrength = (p: string) => {
    if (p.length === 0) return { label: '', color: '', width: '0%' };
    if (p.length < 6) return { label: 'Weak', color: '#F43F5E', width: '25%' };
    if (p.length < 10) return { label: 'Fair', color: '#F59E0B', width: '55%' };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: 'Strong', color: '#10B981', width: '100%' };
    return { label: 'Good', color: '#10B981', width: '75%' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    const result = await signup(name, email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-bg-orb auth-orb-1" />
      <div className="auth-bg-orb auth-orb-2" />
      <div className="auth-bg-orb auth-orb-3" />

      <Link href="/landing" className="auth-back-link">← Back to Home</Link>

      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <span className="auth-logo-text">KasFlow</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start managing your finances for free today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-row">
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-name">Full Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input
                  id="signup-name"
                  type="text"
                  className="auth-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="signup-email">Email Address</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉️</span>
                <input
                  id="signup-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-password">Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">🔒</span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {password && (
              <div className="password-strength-bar">
                <div
                  className="password-strength-fill"
                  style={{ width: strength.width, background: strength.color }}
                />
              </div>
            )}
            {password && (
              <span className="password-strength-label" style={{ color: strength.color }}>
                {strength.label} password
              </span>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">🔒</span>
              <input
                id="signup-confirm"
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            id="signup-submit"
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? <span className="auth-spinner" /> : '🚀 Create Account'}
          </button>

          <p className="auth-terms">
            By signing up, you agree to our{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Terms of Service</span>{' '}
            and{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Privacy Policy</span>.
          </p>
        </form>

        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        <Link href="/login" className="auth-alt-btn" id="go-to-login">
          Sign In Instead
        </Link>
      </div>
    </div>
  );
}
