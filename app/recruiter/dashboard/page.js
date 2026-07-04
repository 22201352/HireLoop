'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RecruiterDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(null);

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
    fetchJobs(parsedUser._id);
  }, [router]);

  const fetchJobs = async (recruiterId) => {
    try {
      const res = await fetch(`/api/jobs?recruiterId=${recruiterId}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (jobId, currentStatus) => {
    setToggleLoading(jobId);
    try {
      await fetch('/api/jobs/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, isOpen: !currentStatus }),
      });
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, isOpen: !currentStatus } : j))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setToggleLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hireloop_user');
    router.push('/');
  };

  const statusBadge = (status) => {
    if (status === 'approved') return <span className="badge bg-success">Approved</span>;
    if (status === 'rejected') return <span className="badge bg-danger">Rejected</span>;
    return <span className="badge bg-warning text-dark">Pending Approval</span>;
  };

  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status === 'approved' && j.isOpen);
  const closedJobs = jobs.filter((j) => j.status === 'approved' && !j.isOpen);

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-success px-4">
        <span className="navbar-brand fw-bold">HireLoop Recruiter</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-white">Hi, {user.name} ({user.companyName})</span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container py-4">
        <h3 className="fw-bold mb-4">Recruiter Dashboard</h3>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-primary mb-0">{activeJobs.length}</h2>
              <p className="text-muted mb-0">Active Job Postings</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-info mb-0">0</h2>
              <p className="text-muted mb-0">Total Applicants</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-success mb-0">0</h2>
              <p className="text-muted mb-0">Shortlisted</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-secondary mb-0">{closedJobs.length}</h2>
              <p className="text-muted mb-0">Closed Postings</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
            <span>My Job Postings</span>
            <Link href="/recruiter/post-job" className="btn btn-primary btn-sm">+ Post New Job</Link>
          </div>
          <div className="card-body">
            {loading ? (
              <p className="text-muted text-center py-4">Loading...</p>
            ) : jobs.length === 0 ? (
              <p className="text-muted text-center py-4">
                No job postings yet. Click &quot;Post New Job&quot; to create one.
              </p>
            ) : (
              jobs.map((job) => (
                <div key={job._id} className="border rounded p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="fw-bold mb-1">{job.title}</h5>
                      <p className="text-muted mb-1">
                        {job.employmentType} • {job.experienceLevel}
                      </p>
                      {job.applicationDeadline && (
                        <p className="text-muted small mb-0">
                          Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-end">
                      <div className="mb-2">{statusBadge(job.status)}</div>
                      {job.status === 'approved' && (
                        <button
                          className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                            job.isOpen
                              ? 'btn-outline-success'
                              : 'btn-outline-secondary'
                          }`}
                          disabled={toggleLoading === job._id}
                          onClick={() => handleToggle(job._id, job.isOpen)}
                          style={{ minWidth: '110px' }}
                        >
                          {toggleLoading === job._id ? (
                            '...'
                          ) : job.isOpen ? (
                            <>🟢 Live</>
                          ) : (
                            <>⚪ Closed</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}