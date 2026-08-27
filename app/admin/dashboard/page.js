'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [recruiters, setRecruiters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('recruiters');
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [recruiterNoteModal, setRecruiterNoteModal] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('hireloop_user');

    if (!storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    if (parsedUser.role !== 'admin') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchAll();
  }, [router]);

  const fetchAll = async () => {
    await Promise.all([fetchRecruiters(), fetchJobs(), fetchPendingComplaints(), fetchAllUsers(), fetchStats()]);
    setLoading(false);
  };

  const fetchRecruiters = async () => {
    try {
      const res = await fetch('/api/admin/recruiters');
      const data = await res.json();
      setRecruiters(data.recruiters || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/admin/jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingComplaints = async () => {
    try {
      const res = await fetch('/api/complaints?status=pending');
      const data = await res.json();
      setPendingComplaints(data.complaints || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setAllUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats({ users: data.users, jobs: data.jobs, applications: data.applications });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openRecruiterNoteModal = (userId, action) => {
    setRecruiterNoteModal({ userId, action });
    setNoteText('');
  };

  const closeRecruiterNoteModal = () => {
    setRecruiterNoteModal(null);
    setNoteText('');
  };

  const confirmRecruiterAction = async () => {
    if (!recruiterNoteModal) return;
    const { userId, action } = recruiterNoteModal;
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/approve-recruiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, note: noteText }),
      });
      if (!res.ok) return;
      await fetchRecruiters();
      closeRecruiterNoteModal();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const openNoteModal = (jobId, action) => {
    setNoteModal({ jobId, action });
    setNoteText('');
  };

  const closeNoteModal = () => {
    setNoteModal(null);
    setNoteText('');
  };

  const confirmJobAction = async () => {
    if (!noteModal) return;
    const { jobId, action } = noteModal;
    setActionLoading(jobId);
    try {
      await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action, note: noteText }),
      });
      await fetchJobs();
      closeNoteModal();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateUser = async (userId) => {
    const confirmed = window.confirm('Deactivate this account? This cannot be undone by the user themselves.');
    if (!confirmed) return;

    setActionLoading(userId);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      await fetchAllUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveJob = async (jobId) => {
    const note = window.prompt('Reason for removing this listing (optional):') || '';
    setActionLoading(jobId);
    try {
      await fetch('/api/admin/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, note }),
      });
      await fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

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

  const pendingRecruiters = recruiters.filter((r) => !r.isApproved);
  const approvedRecruiters = recruiters.filter((r) => r.isApproved);
  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const approvedJobs = jobs.filter((j) => j.status === 'approved');

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold">HireLoop Admin</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-white">Hi, {user.name}</span>
          <Link href="/admin/complaints" className="btn btn-outline-light btn-sm position-relative">
            Complaints
            {pendingComplaints.length > 0 && <span className="badge bg-danger ms-2">{pendingComplaints.length}</span>}
          </Link>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container py-4">
        <h3 className="fw-bold mb-4">Admin Dashboard</h3>

        {pendingComplaints.length > 0 && (
          <div className="alert alert-warning d-flex justify-content-between align-items-center gap-3" role="alert">
            <span><strong>Attention:</strong> {pendingComplaints.length} complaint{pendingComplaints.length === 1 ? '' : 's'} need review.</span>
            <Link href="/admin/complaints?status=pending" className="btn btn-sm btn-warning">Review complaints</Link>
          </div>
        )}

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-warning mb-0">{pendingRecruiters.length}</h2>
              <p className="text-muted mb-0">Pending Recruiters</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-success mb-0">{approvedRecruiters.length}</h2>
              <p className="text-muted mb-0">Approved Recruiters</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-warning mb-0">{pendingJobs.length}</h2>
              <p className="text-muted mb-0">Pending Jobs</p>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm text-center p-3">
              <h2 className="fw-bold text-success mb-0">{approvedJobs.length}</h2>
              <p className="text-muted mb-0">Approved Jobs</p>
            </div>
          </div>
        </div>

        {stats && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm text-center p-3">
                <h2 className="fw-bold text-primary mb-0">{stats.users.candidate}</h2>
                <p className="text-muted mb-0">Candidates</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm text-center p-3">
                <h2 className="fw-bold text-primary mb-0">{stats.users.recruiter}</h2>
                <p className="text-muted mb-0">Recruiters (total)</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm text-center p-3">
                <h2 className="fw-bold text-info mb-0">{stats.applications.totalProcessed}</h2>
                <p className="text-muted mb-0">Applications Processed</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm text-center p-3">
                <h2 className="fw-bold text-info mb-0">{stats.applications.aiScored}</h2>
                <p className="text-muted mb-0">AI Scored ({stats.applications.avgAiScore}% avg)</p>
              </div>
            </div>
          </div>
        )}

        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'recruiters' ? 'active fw-semibold' : ''}`}
              onClick={() => setActiveTab('recruiters')}
            >
              Recruiter Approvals
              {pendingRecruiters.length > 0 && (
                <span className="badge bg-danger ms-2">{pendingRecruiters.length}</span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'jobs' ? 'active fw-semibold' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              Job Approvals
              {pendingJobs.length > 0 && (
                <span className="badge bg-danger ms-2">{pendingJobs.length}</span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'users' ? 'active fw-semibold' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Manage Users
            </button>
          </li>
        </ul>

        {activeTab === 'recruiters' && (
          <div className="card shadow-sm">
            <div className="card-header bg-white fw-bold">Pending Recruiter Approvals</div>
            <div className="card-body">
              {loading ? (
                <p className="text-muted text-center py-3">Loading...</p>
              ) : pendingRecruiters.length === 0 ? (
                <p className="text-muted text-center py-3">No pending recruiters.</p>
              ) : (
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Designation</th>
                      <th>Business Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRecruiters.map((r) => (
                      <tr key={r._id}>
                        <td>{r.name}</td>
                        <td>{r.companyName}</td>
                        <td>{r.designation}</td>
                        <td>{r.businessEmail}</td>
                        <td>
                          <button
                            className="btn btn-success btn-sm me-2"
                            disabled={actionLoading === r._id}
                            onClick={() => openRecruiterNoteModal(r._id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading === r._id}
                            onClick={() => openRecruiterNoteModal(r._id, 'reject')}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="card shadow-sm">
            <div className="card-header bg-white fw-bold">Pending Job Approvals</div>
            <div className="card-body">
              {loading ? (
                <p className="text-muted text-center py-3">Loading...</p>
              ) : pendingJobs.length === 0 ? (
                <p className="text-muted text-center py-3">No pending jobs.</p>
              ) : (
                pendingJobs.map((job) => (
                  <div key={job._id} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="fw-bold mb-0">{job.title}</h5>
                        <p className="text-muted mb-0">
                          {job.companyName} • {job.employmentType} • {job.experienceLevel}
                        </p>
                      </div>
                      <div>
                        <button
                          className="btn btn-success btn-sm me-2"
                          disabled={actionLoading === job._id}
                          onClick={() => openNoteModal(job._id, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={actionLoading === job._id}
                          onClick={() => openNoteModal(job._id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <p className="mb-2">{job.description}</p>
                    <div>
                      {job.skills?.map((skill, i) => (
                        <span key={i} className="badge bg-light text-dark border me-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-muted small mb-0 mt-2">
                      Salary: ৳{job.salaryMin?.toLocaleString()} - ৳{job.salaryMax?.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="card-header bg-white fw-bold border-top">Approved Listings</div>
            <div className="card-body">
              {approvedJobs.length === 0 ? (
                <p className="text-muted text-center py-3">No approved listings.</p>
              ) : (
                approvedJobs.map((job) => (
                  <div key={job._id} className="border rounded p-3 mb-3 d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold mb-0">{job.title}</h6>
                      <small className="text-muted">{job.companyName}</small>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      disabled={actionLoading === job._id}
                      onClick={() => handleRemoveJob(job._id)}
                    >
                      {actionLoading === job._id ? 'Processing...' : 'Remove Listing'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card shadow-sm">
            <div className="card-header bg-white fw-bold">All Users</div>
            <div className="card-body">
              {allUsers.length === 0 ? (
                <p className="text-muted text-center py-3">No users found.</p>
              ) : (
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td className="text-capitalize">{u.role}</td>
                        <td>{u.email}</td>
                        <td>
                          {u.isSuspended ? (
                            <span className="badge bg-danger">Suspended</span>
                          ) : (
                            <span className="badge bg-success">Active</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            disabled={u.isSuspended || actionLoading === u._id || u.role === 'admin'}
                            onClick={() => handleDeactivateUser(u._id)}
                          >
                            {actionLoading === u._id ? 'Processing...' : 'Deactivate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {noteModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="card shadow-lg p-4" style={{ maxWidth: '450px', width: '90%' }}>
            <h5 className="fw-bold mb-3">
              {noteModal.action === 'approve' ? 'Approve Job Listing' : 'Reject Job Listing'}
            </h5>
            <label className="form-label">Note (optional)</label>
            <textarea
              className="form-control mb-3"
              rows="3"
              placeholder={
                noteModal.action === 'approve'
                  ? 'e.g. Looks good, approved.'
                  : 'e.g. Salary range unclear, please revise.'
              }
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={closeNoteModal}>
                Cancel
              </button>
              <button
                className={`btn ${noteModal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={confirmJobAction}
                disabled={actionLoading === noteModal.jobId}
              >
                {actionLoading === noteModal.jobId
                  ? 'Processing...'
                  : noteModal.action === 'approve'
                  ? 'Confirm Approve'
                  : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {recruiterNoteModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="card shadow-lg p-4" style={{ maxWidth: '450px', width: '90%' }}>
            <h5 className="fw-bold mb-3">
              {recruiterNoteModal.action === 'approve'
                ? 'Approve Recruiter Account'
                : 'Reject Recruiter Account'}
            </h5>
            <label className="form-label">Note (optional)</label>
            <textarea
              className="form-control mb-3"
              rows="3"
              placeholder="Add an explanation for the recruiter..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={closeRecruiterNoteModal}>
                Cancel
              </button>
              <button
                className={`btn ${recruiterNoteModal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={confirmRecruiterAction}
                disabled={actionLoading === recruiterNoteModal.userId}
              >
                {actionLoading === recruiterNoteModal.userId
                  ? 'Processing...'
                  : recruiterNoteModal.action === 'approve'
                  ? 'Confirm Approve'
                  : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}