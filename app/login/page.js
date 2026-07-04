'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      // Save user info locally so dashboard can access it
      localStorage.setItem('hireloop_user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'candidate') {
        router.push('/candidate/dashboard');
      } else if (data.user.role === 'recruiter') {
        router.push('/recruiter/dashboard');
      } else if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      }

      
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center bg-light" style={{ minHeight: '100vh' }}>
      <div className="card shadow-sm p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h3 className="text-center fw-bold text-primary mb-4">Welcome Back</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              required
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              required
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0">
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}