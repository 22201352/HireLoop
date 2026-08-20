'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplicationHistory() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [applicationToCancel, setApplicationToCancel] = useState(null);

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

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/candidate/history?candidateId=${user._id}`);
        const data = await res.json();

        if (res.ok) {
          setApplications(data.applications);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const handleCancel = async () => {
    if (!applicationToCancel) return;

    const applicationId = applicationToCancel._id;
    setCancellingId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: user._id }),
      });

      const data = await res.json();

      if (res.ok) {
        setApplications((prev) =>
          data.status === 'cancelled'
            ? prev.map((app) =>
                app._id === data.applicationId ? { ...app, status: data.status } : app
              )
            : prev.filter((app) => app._id !== data.applicationId)
        );
        setApplicationToCancel(null);
      } else {
        alert(data.error || 'Unable to cancel application');
      }
    } catch (err) {
      console.error('Failed to cancel application:', err);
      alert('Something went wrong');
    } finally {
      setCancellingId(null);
    }
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
          <Link href="/candidate/dashboard" className="btn btn-outline-light btn-sm">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        <h3 className="fw-bold mb-4">Application History</h3>

        <div className="card shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <p className="text-muted text-center py-5">Loading...</p>
            ) : applications.length === 0 ? (
              <p className="text-muted text-center py-5">
                You haven&apos;t applied to any jobs yet.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Salary Range</th>
                      <th>Employment Type</th>
                      <th>Date Applied</th>
                      <th>Skill Match Score</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const job = app.jobDetails && app.jobDetails[0];
                      return (
                        <tr key={app._id}>
                          <td>{app.jobTitle}</td>
                          <td>{app.companyName}</td>
                          <td>
                            {job ? `$${job.salaryMin} - $${job.salaryMax}` : '—'}
                          </td>
                          <td>{job ? job.employmentType : '—'}</td>
                          <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                          <td>{app.aiScore}</td>
                          <td className="text-capitalize">{app.status}</td>
                          <td>
                            {['pending', 'reviewed', 'shortlisted'].includes(app.status) && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                disabled={cancellingId === app._id}
                                onClick={() => setApplicationToCancel(app)}
                              >
                                {cancellingId === app._id ? 'Cancelling...' : 'Cancel Application'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {applicationToCancel && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-application-title"
          onClick={() => setApplicationToCancel(null)}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title" id="cancel-application-title">
                  Cancel application?
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setApplicationToCancel(null)}
                />
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to cancel your application for{' '}
                  <strong>{applicationToCancel.jobTitle}</strong>?
                </p>
                {applicationToCancel.status === 'shortlisted' && (
                  <div className="alert alert-warning mt-3 mb-0">
                    <strong>Warning:</strong> You have been shortlisted. Cancelling will withdraw you from consideration and cancel any scheduled interview for this job.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setApplicationToCancel(null)}
                  disabled={cancellingId === applicationToCancel._id}
                >
                  Keep Application
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={cancellingId === applicationToCancel._id}
                >
                  {cancellingId === applicationToCancel._id ? 'Cancelling...' : 'Cancel Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}