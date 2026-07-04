'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PostJobPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    experienceLevel: 'Entry Level',
    salaryMin: '',
    salaryMax: '',
    employmentType: 'Full-time',
    applicationDeadline: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('hireloop_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'recruiter') {
      router.push('/login');
      return;
    }
    setUser(parsedUser);
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recruiterId: user._id,
          recruiterName: user.name,
          companyName: user.companyName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to post job');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/recruiter/dashboard'), 1800);
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-success" role="status" />
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #e8f5ee 0%, #f0f7ff 100%)', minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-success px-4 shadow-sm">
        <span className="navbar-brand fw-bold">HireLoop Recruiter</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <Link href="/recruiter/dashboard" className="btn btn-outline-light btn-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-success">Post a New Job</h2>
              <p className="text-muted">
                Fill in the details below. Your listing will go live once approved by admin.
              </p>
            </div>

            {success && (
              <div className="alert alert-success d-flex align-items-center gap-2 shadow-sm">
                <span style={{ fontSize: '1.3rem' }}>✅</span>
                <div>Job submitted successfully! Redirecting to your dashboard...</div>
              </div>
            )}

            {error && <div className="alert alert-danger shadow-sm">{error}</div>}

            {!success && (
              <div className="card border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                <div className="card-body p-4 p-md-5">
                  <form onSubmit={handleSubmit}>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">Job Title</label>
                      <input
                        type="text"
                        name="title"
                        className="form-control form-control-lg"
                        placeholder="e.g. Frontend Developer"
                        required
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">Job Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="5"
                        placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                        required
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">Required Skills</label>
                      <input
                        type="text"
                        name="skills"
                        className="form-control"
                        placeholder="e.g. React, Node.js, MongoDB (comma separated)"
                        required
                        onChange={handleChange}
                      />
                      <div className="form-text">Separate each skill with a comma</div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <label className="form-label fw-semibold">Experience Level</label>
                        <select
                          name="experienceLevel"
                          className="form-select"
                          onChange={handleChange}
                          value={formData.experienceLevel}
                        >
                          <option>Entry Level</option>
                          <option>Mid Level</option>
                          <option>Senior Level</option>
                          <option>Internship</option>
                        </select>
                      </div>

                      <div className="col-md-6 mb-4">
                        <label className="form-label fw-semibold">Employment Type</label>
                        <select
                          name="employmentType"
                          className="form-select"
                          onChange={handleChange}
                          value={formData.employmentType}
                        >
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Contract</option>
                          <option>Remote</option>
                          <option>Internship</option>
                        </select>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <label className="form-label fw-semibold">Minimum Salary (BDT)</label>
                        <input
                          type="number"
                          name="salaryMin"
                          className="form-control"
                          placeholder="e.g. 30000"
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-6 mb-4">
                        <label className="form-label fw-semibold">Maximum Salary (BDT)</label>
                        <input
                          type="number"
                          name="salaryMax"
                          className="form-control"
                          placeholder="e.g. 60000"
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">Application Deadline</label>
                      <input
                        type="date"
                        name="applicationDeadline"
                        className="form-control"
                        required
                        onChange={handleChange}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-success btn-lg w-100 fw-semibold"
                      disabled={loading}
                      style={{ borderRadius: '10px' }}
                    >
                      {loading ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}