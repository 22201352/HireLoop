'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CandidateDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('hireloop_user');

    if (!storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    if (parsedUser.role !== 'candidate') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('hireloop_user');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">HireLoop</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <Link href="/candidate/jobs" className="btn btn-outline-light btn-sm">
            Browse Jobs
          </Link>
          <span className="text-white">Hi, {user.name}</span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container py-4">
        <h3 className="fw-bold mb-4">Candidate Dashboard</h3>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-primary mb-0">0</h2>
              <p className="text-muted mb-0">Total Applications</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-warning mb-0">0</h2>
              <p className="text-muted mb-0">Pending</p>
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
              <h2 className="fw-bold text-danger mb-0">0</h2>
              <p className="text-muted mb-0">Rejected</p>
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-header bg-white fw-bold">Recent Applications</div>
          <div className="card-body text-center text-muted py-5">
            No applications yet.{' '}
            <Link href="/candidate/jobs">Browse jobs</Link> to apply!
          </div>
        </div>
      </div>
    </div>
  );
}