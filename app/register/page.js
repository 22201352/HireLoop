'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('candidate');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
    designation: '',
    businessEmail: '',
  });
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
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      router.push('/login');
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center bg-light" style={{ minHeight: '100vh' }}>
      <div className="card shadow-sm p-4" style={{ maxWidth: '450px', width: '100%' }}>
        <h3 className="text-center fw-bold text-primary mb-4">Create Account</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">I am a</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              required
              onChange={handleChange}
            />
          </div>

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
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              name="phone"
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

          {role === 'recruiter' && (
            <>
              <hr />
              <p className="text-muted small">Recruiter Verification</p>

              <div className="mb-3">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-control"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  name="designation"
                  className="form-control"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Business Email</label>
                <input
                  type="email"
                  name="businessEmail"
                  className="form-control"
                  required
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}