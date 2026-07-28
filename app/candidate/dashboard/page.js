'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CandidateDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const [interviews, setInterviews] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

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

    const fetchApplications = async () => {
      try {
        const res = await fetch(`/api/applications?candidateId=${user._id}`);
        const data = await res.json();

        if (res.ok) {
          setApplications(data.applications);
        }
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      } finally {
        setLoadingApps(false);
      }
    };

    fetchApplications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchInterviews = async () => {
      try {
        const res = await fetch(`/api/interviews?candidateId=${user._id}`);
        const data = await res.json();

        if (res.ok) {
          setInterviews(data.interviews);
        }
      } catch (err) {
        console.error('Failed to fetch interviews:', err);
      }
    };

    fetchInterviews();
  }, [user]);

  const totalApplications = applications.length;
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const shortlistedCount = applications.filter(app => app.status === 'shortlisted').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  const chartData = [
    { name: 'Pending', value: pendingCount, color: '#ffc107' },
    { name: 'Shortlisted', value: shortlistedCount, color: '#198754' },
    { name: 'Rejected', value: rejectedCount, color: '#dc3545' },
  ].filter(item => item.value > 0);

  const handleLogout = () => {
    localStorage.removeItem('hireloop_user');
    router.push('/');
  };

const handleConfirmSlot = async (interviewId, selectedSlot) => {
    const confirmed = window.confirm(
      `Confirm interview for ${new Date(selectedSlot).toLocaleString()}?`
    );

    if (!confirmed) return;

    setConfirmingId(interviewId);
    try {
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedSlot }),
      });

if (res.ok) {
        setInterviews((prev) =>
          prev.map((iv) =>
            iv._id === interviewId
              ? { ...iv, confirmedSlot: selectedSlot, status: 'confirmed', confirmedAt: new Date() }
              : iv
          )
        );
      } else {
        alert('Failed to confirm interview');
      }
    } catch (err) {
      console.error('Failed to confirm interview:', err);
    } finally {
      setConfirmingId(null);
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

        {loadingApps ? (
          <p className="text-muted text-center py-5">Loading your applications...</p>
        ) : (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card shadow-sm text-center p-3">
                  <h2 className="fw-bold text-primary mb-0">{totalApplications}</h2>
                  <p className="text-muted mb-0">Total Applications</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm text-center p-3">
                  <h2 className="fw-bold text-warning mb-0">{pendingCount}</h2>
                  <p className="text-muted mb-0">Pending</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm text-center p-3">
                  <h2 className="fw-bold text-success mb-0">{shortlistedCount}</h2>
                  <p className="text-muted mb-0">Shortlisted</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm text-center p-3">
                  <h2 className="fw-bold text-danger mb-0">{rejectedCount}</h2>
                  <p className="text-muted mb-0">Rejected</p>
                </div>
              </div>
            </div>

            {interviews.filter((iv) => iv.status === 'proposed').length > 0 && (
              <div className="card shadow-sm mb-4 border-primary">
                <div className="card-header bg-white fw-bold">Interview Invitations</div>
                <div className="card-body">
                  {interviews
                    .filter((iv) => iv.status === 'proposed')
                    .map((iv) => (
                      <div key={iv._id} className="border rounded p-3 mb-2">
                        <div className="fw-bold">{iv.jobTitle}</div>
                        <small className="text-muted d-block mb-2">{iv.companyName}</small>
                        <p className="mb-2 small">Pick a time that works for you:</p>
                        <div className="d-flex flex-wrap gap-2">
                          {iv.proposedSlots.map((slot, index) => (
                            <button
                              key={index}
                              className="btn btn-sm btn-outline-primary"
                              disabled={confirmingId === iv._id}
                              onClick={() => handleConfirmSlot(iv._id, slot)}
                            >
                              {new Date(slot).toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {interviews.filter((iv) => iv.status === 'confirmed').length > 0 && (
              <div className="card shadow-sm mb-4 border-success">
                <div className="card-header bg-white fw-bold">Confirmed Interviews</div>
                <div className="card-body">
                  {interviews
                    .filter((iv) => iv.status === 'confirmed')
                    .map((iv) => (
                      <div key={iv._id} className="border rounded p-3 mb-2">
                        <div className="fw-bold">{iv.jobTitle}</div>
                        <small className="text-muted d-block mb-1">{iv.companyName}</small>
                        <span className="badge bg-success">
                          {new Date(iv.confirmedSlot).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="card shadow-sm">
              <div className="card-header bg-white fw-bold">Recent Applications</div>
              <div className="card-body p-0">
                {applications.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    No applications yet.{' '}
                    <Link href="/candidate/jobs">Browse jobs</Link> to apply!
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {applications.slice(0, 5).map((app) => (
                      <li key={app._id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{app.jobTitle}</div>
                          <small className="text-muted">{app.companyName}</small>
                        </div>
                        <span className="badge bg-secondary text-capitalize">{app.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="card shadow-sm mt-4">
              <div className="card-body text-center py-4">
                <Link href="/candidate/history" className="btn btn-primary">
                  View Full Application History
                </Link>
              </div>
            </div>
            
            <div className="card shadow-sm mt-4">
              <div className="card-body text-center py-4">
                <Link href="/candidate/resume" className="btn btn-outline-primary">
                  View / Update Resume
                </Link>
              </div>
            </div>

            <div className="card shadow-sm mt-4">
              <div className="card-header bg-white fw-bold">Application Breakdown</div>
              <div className="card-body">
                {totalApplications === 0 ? (
                  <p className="text-muted text-center py-4">No data to display yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}