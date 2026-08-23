'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function formatComplaintDescription(description) {
  const lines = String(description || '').split('\n');

  return lines.map((line, lineIndex) => (
    <span key={lineIndex}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => (
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
          : part
      ))}
      {lineIndex < lines.length - 1 && <br />}
    </span>
  ));
}

export default function AdminComplaintsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedComplainant, setSelectedComplainant] = useState(null);
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [recruiterLoading, setRecruiterLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [actionTaken, setActionTaken] = useState('none');
  const [confirmSuspension, setConfirmSuspension] = useState(false);

  const targetTypeLabel = (complaint) => {
    if (complaint.targetType === 'job') return 'Job';
    if (complaint.targetRole === 'candidate') return 'Candidate';
    if (complaint.targetRole === 'recruiter') return 'Recruiter';
    return 'User';
  };

  const isCompleted = selectedComplaint?.status === 'resolved' || selectedComplaint?.status === 'dismissed';
  const recordedAction = selectedComplaint?.actionTaken || 'none';
  const affectedAccount = selectedComplaint?.targetType === 'job' ? selectedRecruiter : selectedTargetUser;
  const isWarningAction = actionTaken === 'user_warned' || actionTaken === 'job_recruiter_warned';
  const canRemoveAccountFlag = Boolean((affectedAccount?.complaintFlags || 0) > 0);

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
  }, [router]);

  const fetchComplaints = useCallback(async (selectedStatus = statusFilter) => {
    try {
      const query = selectedStatus === 'all' ? '' : `?status=${selectedStatus}`;
      const res = await fetch(`/api/complaints${query}`);
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!user) return;
    fetchComplaints(statusFilter);
  }, [user, statusFilter, fetchComplaints]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const openDecisionModal = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedComplainant(null);
    setSelectedRecruiter(null);
    setSelectedTargetUser(null);
    setSelectedJob(null);
    setDetailsLoading(true);
    setNoteText(complaint.adminNote || '');
    setActionTaken('none');
    setConfirmSuspension(false);

    Promise.all([
      fetch(`/api/admin/users/${complaint.complainantId}`).then((res) => res.ok ? res.json() : null),
      complaint.targetType === 'job'
        ? fetch(`/api/admin/jobs?jobId=${complaint.targetId}`).then((res) => res.ok ? res.json() : null)
        : fetch(`/api/admin/users/${complaint.targetId}`).then((res) => res.ok ? res.json() : null),
    ])
      .then(([complainantData, targetData]) => {
        setSelectedComplainant(complainantData?.user || null);
        if (complaint.targetType === 'job') {
          setSelectedJob(targetData?.job || null);
          setSelectedRecruiter(targetData?.recruiter || null);
        } else {
          setSelectedTargetUser(targetData?.user || null);
        }
      })
      .catch((error) => console.error(error))
      .finally(() => {
        setDetailsLoading(false);
        setRecruiterLoading(false);
      });
  };

  const closeDecisionModal = () => {
    setSelectedComplaint(null);
    setSelectedComplainant(null);
    setSelectedJob(null);
    setSelectedRecruiter(null);
    setSelectedTargetUser(null);
    setRecruiterLoading(false);
    setDetailsLoading(false);
    setNoteText('');
    setActionTaken('none');
    setConfirmSuspension(false);
  };

  const handleSubmitDecision = async () => {
    if (!selectedComplaint) return;
    if (actionTaken === 'user_suspended' && !confirmSuspension) return;
    setActionLoading(selectedComplaint._id);

    try {
      const res = await fetch(`/api/complaints/${selectedComplaint._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionTaken === 'none' ? 'dismissed' : (isWarningAction || actionTaken === 'account_flagged' || actionTaken === 'warning_flag_removed') ? 'under_review' : 'resolved',
          adminNote: isWarningAction ? '' : noteText,
          warningNote: isWarningAction ? noteText : '',
          actionTaken,
        }),
      });

      if (res.ok) {
        closeDecisionModal();
        await fetchComplaints(statusFilter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status) => {
    if (status === 'resolved') return <span className="badge bg-success">Resolved</span>;
    if (status === 'dismissed') return <span className="badge bg-secondary">Dismissed</span>;
    if (status === 'under_review' || status === 'warning_issued') return <span className="badge bg-info text-dark">Under review</span>;
    return <span className="badge bg-warning text-dark">Pending</span>;
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleComplaints = complaints
    .filter((complaint) => {
      if (!normalizedSearch) return true;
      return [
        complaint.complainantName,
        complaint.complainantRole,
        complaint.targetName,
        complaint.targetType,
        complaint.category,
        complaint.description,
      ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    })
    .sort((first, second) => {
      if (sortBy === 'oldest') return new Date(first.createdAt) - new Date(second.createdAt);
      if (sortBy === 'category') return String(first.category || '').localeCompare(String(second.category || ''));
      return new Date(second.createdAt) - new Date(first.createdAt);
    });
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(visibleComplaints.length / pageSize));
  const paginatedComplaints = visibleComplaints.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!user) {
    return <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}><div className="spinner-border text-primary" role="status" /></div>;
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold">HireLoop Admin</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <Link href="/admin/dashboard" className="btn btn-sm admin-nav-link">Back to Dashboard</Link>
        </div>
      </nav>

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-wrap">
          <div>
            <h3 className="fw-bold mb-1">Complaint History</h3>
            <div className="text-muted small">Review reports and verify the people or listings involved.</div>
          </div>
          <Link href="/admin/dashboard" className="btn btn-outline-secondary btn-sm">Back to Dashboard</Link>
        </div>

        <div className="card border-0 shadow-sm mb-4 complaints-toolbar">
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">
          <div className="col-md-6 complaints-search">
            <label htmlFor="complaint-search" className="form-label small fw-semibold mb-1">Search complaints</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text complaints-search-icon" aria-hidden="true">🔍</span>
              <input id="complaint-search" className="form-control" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Name, job, category..." aria-label="Search complaints" />
            </div>
          </div>
          <div className="col-md-3 complaints-control">
            <label htmlFor="complaint-sort" className="form-label small fw-semibold mb-1">Sort by</label>
            <select id="complaint-sort" className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort complaints">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div className="col-md-3 complaints-control">
            <label htmlFor="complaint-filter" className="form-label small fw-semibold mb-1">Status</label>
            <select id="complaint-filter" className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All complaints</option>
              <option value="pending">Pending</option>
              <option value="warning_issued">Warning issued</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm p-4 complaints-history-card">
            {loading ? (
              <p className="text-muted text-center py-5">Loading complaints...</p>
            ) : visibleComplaints.length === 0 ? (
              <p className="text-muted text-center py-5">No complaints match your search.</p>
            ) : (
              <div className="table-responsive complaints-table-frame">
                <table className="table table-hover mb-0 complaints-table">
                  <thead>
                    <tr>
                      <th scope="col">Complainant</th>
                      <th scope="col">Target</th>
                      <th scope="col">Category</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedComplaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td>
                          <Link href={`/admin/users/${complaint.complainantId}`} className="complaint-entity-link fw-semibold">{complaint.complainantName}</Link>
                          <span className="d-block text-muted text-capitalize complaint-type-badge">{complaint.complainantRole}</span>
                        </td>
                        <td>
                          <Link href={complaint.targetType === 'job' ? `/admin/jobs/${complaint.targetId}` : `/admin/users/${complaint.targetId}`} className="complaint-entity-link fw-semibold">{complaint.targetName}</Link>
                          <span className="d-block text-muted complaint-type-badge">{targetTypeLabel(complaint)}</span>
                        </td>
                        <td>{complaint.category}</td>
                        <td>{statusBadge(complaint.status)}</td>
                        <td>
                          <button className={`btn btn-sm ${complaint.status === 'pending' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => openDecisionModal(complaint)}>
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="d-flex justify-content-between align-items-center border-top gap-3 flex-wrap complaints-pagination-bar">
                  <small className="text-muted">Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, visibleComplaints.length)} of {visibleComplaints.length}</small>
                  <div className="btn-group btn-group-sm complaint-pagination" role="group" aria-label="Complaint pages">
                    <button className="btn btn-outline-secondary" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</button>
                    <span className="btn btn-light disabled">Page {currentPage} of {totalPages}</span>
                    <button className="btn btn-outline-secondary" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {selectedComplaint && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center complaint-modal-backdrop"
          style={{ background: 'rgba(15, 23, 42, 0.78)', backdropFilter: 'blur(4px)', zIndex: 1050, padding: '1rem', overflow: 'hidden' }}
          onClick={closeDecisionModal}
        >
          <div
            className="card shadow-lg complaint-modal"
            style={{ width: 'min(92vw, 900px)', height: 'min(720px, calc(100dvh - 2rem))', maxHeight: 'calc(100dvh - 2rem)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom complaint-modal-header" style={{ flex: '0 0 auto' }}>
              <div className="d-flex align-items-center gap-3">
                <h5 className="fw-bold mb-1">Review Complaint</h5>
                <div className="small text-muted">{selectedComplaint.category} · {selectedComplaint.targetName}</div>
              </div>
              <button type="button" className="btn-close" onClick={closeDecisionModal} aria-label="Close" />
            </div>

            <div className="complaint-modal-body" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
              <div className="row g-0">
              <div className="col-lg-6 p-4 border-end">
                <section className="border rounded p-3 mb-3">
                  <h6 className="fw-bold mb-3">People & target</h6>
                  <div className="small text-muted mb-1">Complainant</div>
                  <div className="fw-semibold">{selectedComplaint.complainantName}</div>
                  <span className="d-block text-muted text-capitalize complaint-type-badge">{selectedComplaint.complainantRole}</span>
                  {detailsLoading ? (
                    <div className="small text-muted mt-2">Loading profile details...</div>
                  ) : selectedComplainant ? (
                    <div className="small text-muted mt-2">{selectedComplainant.email}{selectedComplainant.phone ? ` · ${selectedComplainant.phone}` : ''}</div>
                  ) : null}

                  <hr />
                  <div className="small text-muted mb-1">Reported {targetTypeLabel(selectedComplaint)}</div>
                  <div className="fw-semibold">{selectedComplaint.targetName}</div>
                  <span className="d-block text-muted complaint-type-badge">{targetTypeLabel(selectedComplaint)}</span>
                  {detailsLoading ? (
                    <div className="small text-muted mt-3">Loading verification details...</div>
                  ) : selectedComplaint.targetType === 'user' && selectedTargetUser ? (
                    <div className="small text-muted mt-3">Verified {selectedTargetUser.role}: {selectedTargetUser.name} · {selectedTargetUser.email}</div>
                  ) : selectedComplaint.targetType === 'job' && selectedJob ? (
                    <div className="small text-muted mt-3">Recruiter: {selectedRecruiter?.name || 'Not available'} ({selectedRecruiter?.email || 'No email'})</div>
                  ) : null}
                  {affectedAccount && (
                    <div className="small text-muted mt-2">
                      Complaint record: {affectedAccount.complaintWarnings || 0} warning{(affectedAccount.complaintWarnings || 0) === 1 ? '' : 's'} · {affectedAccount.complaintFlags || 0} flag{(affectedAccount.complaintFlags || 0) === 1 ? '' : 's'}
                    </div>
                  )}
                </section>

                {!isCompleted && selectedComplaint.targetType === 'job' && (
                  <section className="border rounded p-3 bg-light">
                    <h6 className="fw-bold mb-2">Recruiter verification</h6>
                    {recruiterLoading ? (
                      <p className="small text-muted mb-0">Loading recruiter...</p>
                    ) : selectedRecruiter ? (
                      <>
                        <p className="small text-muted mb-3">Verify the recruiter responsible for this listing.</p>
                        <div className="fw-semibold">{selectedRecruiter.name}</div>
                        <Link href={`/admin/users/${selectedRecruiter._id}`} className="btn btn-sm btn-outline-primary mt-2 mb-2">View recruiter</Link>
                        <div className="small text-muted">{selectedRecruiter.designation || 'Recruiter'} at {selectedRecruiter.companyName || 'Company not specified'}</div>
                        <div className="small">{selectedRecruiter.businessEmail || selectedRecruiter.email}</div>
                      </>
                    ) : (
                      <p className="small text-muted mb-0">Recruiter profile unavailable.</p>
                    )}
                  </section>
                )}
              </div>

              <div className="col-lg-6 p-4">
                <section className="border rounded p-3 mb-3">
                  <h6 className="fw-bold mb-2">Complaint report</h6>
                  <p className="mb-0 complaint-report-text">{formatComplaintDescription(selectedComplaint.description)}</p>
                </section>

                {selectedComplaint.evidenceUrl && (
                  <a href={selectedComplaint.evidenceUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary mb-3">
                    View Evidence
                  </a>
                )}

                <section className="border rounded p-3 bg-light mb-3">
                  <h6 className="fw-bold mb-3">{isCompleted ? 'Decision recorded' : 'Decision'}</h6>
                  <label htmlFor="complaint-action" className="form-label small text-muted">{isCompleted ? 'Action taken' : 'Action to take'}</label>
                  <select id="complaint-action" className="form-select" value={isCompleted ? recordedAction : actionTaken} disabled={isCompleted} onChange={(e) => { setActionTaken(e.target.value); setConfirmSuspension(false); }}>
                    <option value="none">No action required / Dismiss report</option>
                    {selectedComplaint.targetType === 'job' && <option value="job_recruiter_warned">Issue warning to recruiter</option>}
                    {selectedComplaint.targetType === 'job' && <option value="account_flagged">Flag recruiter account</option>}
                    {selectedComplaint.targetType === 'job' && <option value="job_closed">Remove job listing</option>}
                    {selectedComplaint.targetType === 'user' && <option value="user_warned">Issue warning to user</option>}
                    {selectedComplaint.targetType === 'user' && <option value="account_flagged">Flag user account</option>}
                    {selectedComplaint.targetType === 'user' && <option value="user_suspended">Suspend user account</option>}
                    {canRemoveAccountFlag && <option value="warning_flag_removed">Remove one account flag</option>}
                  </select>
                  {!isCompleted && (recordedAction === 'user_warned' || recordedAction === 'job_recruiter_warned') && (
                    <div className="alert alert-info py-2 small mt-3 mb-0">A warning has already been issued for this complaint. You can now flag the account or take further action.</div>
                  )}
                  {actionTaken === 'user_suspended' && (
                    <label className="form-check mt-3 text-danger">
                      <input className="form-check-input" type="checkbox" checked={confirmSuspension} onChange={(e) => setConfirmSuspension(e.target.checked)} />
                      <span className="form-check-label">I confirm this account should be suspended.</span>
                    </label>
                  )}
                  <label className="form-label fw-semibold mt-4">
                    {isWarningAction ? 'Warning message to user' : 'Resolution note'} {isWarningAction ? <span className="text-danger">(Required)</span> : <span className="text-muted fw-normal">(Optional)</span>}
                  </label>
                  {isWarningAction && <div className="form-text mt-0 mb-2">This message is sent only to the affected account.</div>}
                  <textarea className="form-control" rows="3" value={noteText} readOnly={isCompleted} onChange={(e) => setNoteText(e.target.value)} placeholder={isWarningAction ? 'Explain the violation and what the user must do to avoid further action.' : 'Add note for complainant'} />
                </section>
              </div>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 p-3 border-top complaint-modal-footer" style={{ flex: '0 0 auto' }}>
              <button type="button" className="btn btn-outline-secondary" onClick={closeDecisionModal}>{isCompleted ? 'Close' : 'Cancel'}</button>
              {!isCompleted && <button type="button" className="btn btn-primary" onClick={handleSubmitDecision} disabled={actionLoading === selectedComplaint._id || (actionTaken === 'user_suspended' && !confirmSuspension) || (isWarningAction && !noteText.trim())}>
                {actionLoading === selectedComplaint._id ? 'Submitting...' : 'Submit Decision'}
              </button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
