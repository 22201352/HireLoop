'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ComplaintModal from '@/components/ComplaintModal';

export default function CandidateDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const [interviews, setInterviews] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [selectedRecommendedJob, setSelectedRecommendedJob] = useState(null);
  const [recommendedApplyResult, setRecommendedApplyResult] = useState(null);
  const [recommendedApplyError, setRecommendedApplyError] = useState('');
  const [applyingRecommendedJob, setApplyingRecommendedJob] = useState(false);

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

    const refreshInterviews = async () => {
      try {
        const res = await fetch(`/api/interviews?candidateId=${user._id}`);
        const data = await res.json();

        if (res.ok) {
          setInterviews(data.interviews);
        }
      } catch (err) {
        console.error('Failed to refresh interviews:', err);
      }
    };

    window.addEventListener('focus', refreshInterviews);
    window.addEventListener('pageshow', refreshInterviews);
    document.addEventListener('visibilitychange', refreshInterviews);

    return () => {
      window.removeEventListener('focus', refreshInterviews);
      window.removeEventListener('pageshow', refreshInterviews);
      document.removeEventListener('visibilitychange', refreshInterviews);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const refreshApplications = async () => {
      try {
        const res = await fetch(`/api/applications?candidateId=${user._id}`);
        const data = await res.json();

        if (res.ok) {
          setApplications(data.applications);
        }
      } catch (err) {
        console.error('Failed to refresh applications:', err);
      }
    };

    window.addEventListener('focus', refreshApplications);
    window.addEventListener('pageshow', refreshApplications);
    document.addEventListener('visibilitychange', refreshApplications);

    return () => {
      window.removeEventListener('focus', refreshApplications);
      window.removeEventListener('pageshow', refreshApplications);
      document.removeEventListener('visibilitychange', refreshApplications);
    };
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

  useEffect(() => {
    if (!user) return;

    const fetchRecommended = async () => {
      try {
        const res = await fetch(`/api/jobs/recommended?candidateId=${user._id}`);
        const data = await res.json();

        if (res.ok) {
          setRecommendedJobs(data.jobs);
        }
      } catch (err) {
        console.error('Failed to fetch recommended jobs:', err);
      } finally {
        setLoadingRecommended(false);
      }
    };

    fetchRecommended();
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

  const openRecommendedJob = (job) => {
    setSelectedRecommendedJob(job);
    setRecommendedApplyResult(null);
    setRecommendedApplyError('');
  };

  const closeRecommendedJob = () => {
    setSelectedRecommendedJob(null);
    setRecommendedApplyResult(null);
    setRecommendedApplyError('');
  };

  const applyToRecommendedJob = async () => {
    if (!selectedRecommendedJob || applyingRecommendedJob) return;

    setApplyingRecommendedJob(true);
    setRecommendedApplyError('');

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: user._id,
          candidateName: user.name,
          jobId: String(selectedRecommendedJob._id),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRecommendedApplyError(data.error || 'Failed to apply');
        return;
      }

      setApplications((prev) => [
        {
          _id: data.applicationId,
          jobId: String(selectedRecommendedJob._id),
          jobTitle: selectedRecommendedJob.title,
          companyName: selectedRecommendedJob.companyName,
          status: 'pending',
          aiScore: data.aiScore,
          aiJustification: data.aiJustification,
        },
        ...prev,
      ]);
      setRecommendedApplyResult(data);
    } catch (err) {
      setRecommendedApplyError('Something went wrong. Try again.');
    } finally {
      setApplyingRecommendedJob(false);
    }
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
                      <li key={app._id} className="list-group-item d-flex justify-content-between align-items-center gap-2">
                        <div>
                          <div className="fw-bold">{app.jobTitle}</div>
                          <small className="text-muted">{app.companyName}</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-secondary text-capitalize">{app.status}</span>
                          <ComplaintModal
                            currentUser={user}
                            targetType="user"
                            targetRole="recruiter"
                            targetId={String(app.recruiterId || user._id)}
                            targetName={app.companyName ? `${app.companyName} Recruiter` : 'Recruiter'}
                            triggerLabel="Report Recruiter"
                            compact
                            buttonClassName="btn btn-light btn-sm border rounded-circle p-2 text-muted"
                          />
                        </div>
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
                <Link href="/candidate/resume" className="btn btn-outline-primary me-2">
                  View / Update Resume
                </Link>
                <Link href="/candidate/complaints" className="btn btn-outline-secondary">
                  My Complaints
                </Link>
              </div>
            </div>

            <div className="card shadow-sm mt-4">
              <div className="card-header bg-white fw-bold">Recommended For You</div>
              <div className="card-body p-0">
                {loadingRecommended ? (
                  <p className="text-muted text-center py-4">Finding jobs that match your skills...</p>
                ) : recommendedJobs.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    No recommendations yet. Add skills to your profile to get matched with jobs.
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {recommendedJobs.map((job) => (
                      <li key={job._id} className="list-group-item p-0">
                        <button
                          type="button"
                          onClick={() => openRecommendedJob(job)}
                          className="btn btn-link d-flex justify-content-between align-items-center text-decoration-none text-reset p-3 w-100 text-start"
                        >
                          <div>
                            <div className="fw-bold">{job.title}</div>
                            <small className="text-muted">{job.companyName}</small>
                          </div>
                          <span className="badge bg-primary">{job.matchCount} skill match{job.matchCount !== 1 ? 'es' : ''}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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

      {selectedRecommendedJob && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="card shadow-lg p-4" style={{ maxWidth: '620px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            {!recommendedApplyResult ? (
              <>
                <h5 className="fw-bold mb-1">{selectedRecommendedJob.title}</h5>
                <p className="text-muted mb-3">{selectedRecommendedJob.companyName}</p>

                <div className="row g-2 mb-3">
                  <div className="col-sm-6">
                    <div className="border rounded p-2 h-100">
                      <small className="text-muted d-block">Employment Type</small>
                      <strong>{selectedRecommendedJob.employmentType || 'Not specified'}</strong>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded p-2 h-100">
                      <small className="text-muted d-block">Experience Level</small>
                      <strong>{selectedRecommendedJob.experienceLevel || 'Not specified'}</strong>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded p-2 h-100">
                      <small className="text-muted d-block">Salary Range</small>
                      <strong>
                        ৳{selectedRecommendedJob.salaryMin?.toLocaleString() || '0'} - ৳{selectedRecommendedJob.salaryMax?.toLocaleString() || '0'}
                      </strong>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded p-2 h-100">
                      <small className="text-muted d-block">Application Deadline</small>
                      <strong>
                        {selectedRecommendedJob.applicationDeadline
                          ? new Date(selectedRecommendedJob.applicationDeadline).toLocaleDateString()
                          : 'Not specified'}
                      </strong>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold">Job Description</h6>
                <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedRecommendedJob.description || 'No description provided.'}
                </p>

                <h6 className="fw-bold">Required Skills</h6>
                <div className="mb-3">
                  {selectedRecommendedJob.skills?.length ? (
                    selectedRecommendedJob.skills.map((skill, index) => (
                      <span key={index} className="badge bg-light text-dark border me-1 mb-1">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">No skills specified.</span>
                  )}
                </div>

                <div className="alert alert-primary">
                  <strong>{selectedRecommendedJob.matchCount}</strong> matching skill{selectedRecommendedJob.matchCount !== 1 ? 's' : ''}
                </div>

                {recommendedApplyError && (
                  <div className="alert alert-danger">{recommendedApplyError}</div>
                )}

                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-outline-secondary" onClick={closeRecommendedJob}>
                    Close
                  </button>
                  {applications.some(
                    (application) =>
                      String(application.jobId) === String(selectedRecommendedJob._id) &&
                      application.status !== 'cancelled'
                  ) ? (
                    <button className="btn btn-success" disabled>
                      Already Applied
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={applyToRecommendedJob}
                      disabled={applyingRecommendedJob}
                    >
                      {applyingRecommendedJob ? 'Submitting & Scoring...' : 'Apply'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h5 className="fw-bold mb-3">Application Submitted!</h5>
                <div className="text-center mb-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success fw-bold mb-2"
                    style={{ width: '80px', height: '80px', fontSize: '1.5rem' }}
                  >
                    {recommendedApplyResult.aiScore}%
                  </div>
                  <p className="text-muted small mb-0">Skill Match Score</p>
                </div>
                <p className="text-center">{recommendedApplyResult.aiJustification}</p>
                <button className="btn btn-primary w-100 mt-2" onClick={closeRecommendedJob}>
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}