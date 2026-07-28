'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const STATUS_OPTIONS = ['pending', 'reviewed', 'shortlisted', 'rejected'];

export default function JobApplicants() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [user, setUser] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [proposingFor, setProposingFor] = useState(null);
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [slot3, setSlot3] = useState('');
  const [proposing, setProposing] = useState(false);

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

  useEffect(() => {
    if (!user || !jobId) return;

    const fetchApplicants = async () => {
      try {
        const res = await fetch(`/api/applicants/${jobId}`);
        const data = await res.json();

        if (res.ok) {
          setApplicants(data.applications);
        }
      } catch (err) {
        console.error('Failed to fetch applicants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [user, jobId]);

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        setApplicants((prev) =>
          prev.map((app) =>
            app._id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProposeInterview = async (app) => {
    if (!slot1 || !slot2 || !slot3) {
      alert('Please fill in all 3 time slots');
      return;
    }

    const now = new Date();
    const slots = [slot1, slot2, slot3];
    const hasPastSlot = slots.some((slot) => new Date(slot) < now);

    if (hasPastSlot) {
      alert('All time slots must be in the future');
      return;
    }

    setProposing(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app._id,
          candidateId: app.candidateId,
          candidateName: app.candidateName,
          recruiterId: user._id,
          jobTitle: app.jobTitle,
          companyName: app.companyName,
          proposedSlots: [slot1, slot2, slot3],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setApplicants((prev) =>
          prev.map((a) =>
            a._id === app._id
              ? { ...a, interview: { _id: data.interviewId, status: 'proposed', proposedSlots: [slot1, slot2, slot3] } }
              : a
          )
        );
        alert('Interview proposed successfully!');
        setProposingFor(null);
        setSlot1('');
        setSlot2('');
        setSlot3('');
      } else {
        alert('Failed to propose interview');
      }
    } catch (err) {
      console.error('Failed to propose interview:', err);
      alert('Something went wrong');
    } finally {
      setProposing(false);
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
      <nav className="navbar navbar-expand-lg navbar-dark bg-success px-4">
        <span className="navbar-brand fw-bold">HireLoop Recruiter</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <Link href="/recruiter/dashboard" className="btn btn-outline-light btn-sm">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        <h3 className="fw-bold mb-4">Applicants</h3>

        <div className="card shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <p className="text-muted text-center py-5">Loading...</p>
            ) : applicants.length === 0 ? (
              <p className="text-muted text-center py-5">No applicants yet for this job.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Email</th>
                      <th>AI Score</th>
                      <th>Resume</th>
                      <th>Justification</th>
                      <th>Status</th>
                      <th>Interview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app) => (
                      <tr key={app._id}>
                        <td>{app.candidateName}</td>
                        <td className="small">{app.candidateEmail || 'N/A'}</td>
                        <td>{app.aiScore}</td>
                        <td>
                          {app.resumeUrl ? (
                            <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer">
                              View Resume
                            </a>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td className="small text-muted">{app.aiJustification}</td>
                        <td>
                          <select
                            className="form-select"
                            style={{ minWidth: '140px' }}
                            value={app.status}
                            disabled={updatingId === app._id}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {app.status === 'shortlisted' && (
                            app.interview ? (
                              app.interview.status === 'confirmed' ? (
                                <span className="badge bg-success">
                                  Confirmed: {new Date(app.interview.confirmedSlot).toLocaleString()}
                                </span>
                              ) : (
                                <span className="badge bg-warning text-dark">
                                  Awaiting candidate response
                                </span>
                              )
                            ) : proposingFor === app._id ? (
                              <div style={{ minWidth: '220px' }}>
                                <input
                                  type="datetime-local"
                                  className="form-control form-control-sm mb-1"
                                  value={slot1}
                                  onChange={(e) => setSlot1(e.target.value)}
                                />
                                <input
                                  type="datetime-local"
                                  className="form-control form-control-sm mb-1"
                                  value={slot2}
                                  onChange={(e) => setSlot2(e.target.value)}
                                />
                                <input
                                  type="datetime-local"
                                  className="form-control form-control-sm mb-2"
                                  value={slot3}
                                  onChange={(e) => setSlot3(e.target.value)}
                                />
                                <button
                                  className="btn btn-sm btn-primary me-1"
                                  disabled={proposing}
                                  onClick={() => handleProposeInterview(app)}
                                >
                                  {proposing ? '...' : 'Submit'}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => setProposingFor(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setProposingFor(app._id)}
                              >
                                Propose Interview
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}