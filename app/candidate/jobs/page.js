'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BrowseJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasResume, setHasResume] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [modalJob, setModalJob] = useState(null);
  const [modalResult, setModalResult] = useState(null);
  const [modalError, setModalError] = useState('');

  const [keyword, setKeyword] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [skill, setSkill] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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
    checkResume(parsedUser._id);
    fetchApplications(parsedUser._id);
  }, [router]);

  const checkResume = async (candidateId) => {
    try {
      const res = await fetch(`/api/resume?candidateId=${candidateId}`);
      const data = await res.json();
      setHasResume(!!data.resume);
    } catch (err) {
      console.error(err);
      setHasResume(false);
    }
  };

  const fetchApplications = async (candidateId) => {
    try {
      const res = await fetch(`/api/applications?candidateId=${candidateId}`);
      const data = await res.json();
      setAppliedJobIds((data.applications || []).map((a) => a.jobId));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (employmentType) params.set('employmentType', employmentType);
      if (experienceLevel) params.set('experienceLevel', experienceLevel);
      if (skill) params.set('skill', skill);
      if (minSalary) params.set('minSalary', minSalary);
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/jobs/approved?${params.toString()}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [keyword, employmentType, experienceLevel, skill, minSalary, sortBy]);

  useEffect(() => {
    if (user) fetchJobs();
  }, [user, fetchJobs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setKeyword('');
    setEmploymentType('');
    setExperienceLevel('');
    setSkill('');
    setMinSalary('');
    setSortBy('newest');
  };

  const openApplyModal = (job) => {
    setModalJob(job);
    setModalResult(null);
    setModalError('');
  };

  const closeModal = () => {
    setModalJob(null);
    setModalResult(null);
    setModalError('');
  };

  const confirmApply = async () => {
    if (!modalJob) return;
    setApplyingJobId(modalJob._id);
    setModalError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: user._id,
          candidateName: user.name,
          jobId: modalJob._id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Failed to apply');
        setApplyingJobId(null);
        return;
      }

      setModalResult(data);
      setAppliedJobIds((prev) => [...prev, modalJob._id]);
      setApplyingJobId(null);
    } catch (err) {
      setModalError('Something went wrong. Try again.');
      setApplyingJobId(null);
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
    <div style={{ background: '#f7f9fc', minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4 shadow-sm">
        <span className="navbar-brand fw-bold">HireLoop</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <Link href="/candidate/resume" className="btn btn-outline-light btn-sm">
            My Resume
          </Link>
          <Link href="/candidate/dashboard" className="btn btn-outline-light btn-sm">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        <h3 className="fw-bold mb-4">Browse Jobs</h3>

        {hasResume === false && (
          <div className="alert alert-warning shadow-sm d-flex justify-content-between align-items-center mb-4">
            <span>You haven&apos;t uploaded a resume yet. You&apos;ll need one before applying.</span>
            <Link href="/candidate/resume" className="btn btn-dark btn-sm">
              Upload Resume
            </Link>
          </div>
        )}

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '14px' }}>
          <div className="card-body p-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Job title or keyword..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-semibold small">Job Type</label>
                  <select
                    className="form-select"
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                  >
                    <option value="">All</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Remote</option>
                    <option>Internship</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-semibold small">Experience</label>
                  <select
                    className="form-select"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <option value="">All</option>
                    <option>Entry Level</option>
                    <option>Mid Level</option>
                    <option>Senior Level</option>
                    <option>Internship</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-semibold small">Skill</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. React"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label fw-semibold small">Min Salary</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="৳"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-3 align-items-end mt-1">
                <div className="col-md-2">
                  <label className="form-label fw-semibold small">Sort By</label>
                  <select
                    className="form-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                <div className="col-md-3 d-flex gap-2">
                  <button type="submit" className="btn btn-primary px-4">
                    Search
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                    Clear
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-muted py-5">
            <h5>No jobs found</h5>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="row g-3">
            {jobs.map((job) => {
              const alreadyApplied = appliedJobIds.includes(job._id);
              return (
                <div className="col-md-6" key={job._id}>
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '14px' }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-bold mb-0">{job.title}</h5>
                        <span className="badge bg-primary-subtle text-primary border">
                          {job.employmentType}
                        </span>
                      </div>
                      <p className="text-muted mb-2">
                        {job.companyName} • {job.experienceLevel}
                      </p>
                      <p className="mb-3" style={{ fontSize: '0.9rem' }}>
                        {job.description.length > 140
                          ? job.description.slice(0, 140) + '...'
                          : job.description}
                      </p>
                      <div className="mb-3">
                        {job.skills?.slice(0, 5).map((s, i) => (
                          <span key={i} className="badge bg-light text-dark border me-1 mb-1">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-success">
                          ৳{job.salaryMin?.toLocaleString()} - ৳{job.salaryMax?.toLocaleString()}
                        </span>
                        {job.applicationDeadline && (
                          <span className="text-muted small">
                            Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {alreadyApplied ? (
                        <button className="btn btn-success w-100 mt-3" disabled>
                          ✓ Applied
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary w-100 mt-3"
                          onClick={() => openApplyModal(job)}
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {modalJob && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="card shadow-lg p-4" style={{ maxWidth: '450px', width: '90%' }}>
            {!modalResult ? (
              <>
                <h5 className="fw-bold mb-3">Apply to {modalJob.title}</h5>

                {hasResume === false ? (
                  <>
                    <p className="text-muted">
                      You need to upload a resume before applying. We&apos;ll use it to calculate your AI match score for this job.
                    </p>
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-outline-secondary" onClick={closeModal}>
                        Cancel
                      </button>
                      <Link href="/candidate/resume" className="btn btn-primary">
                        Upload Resume
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted">
                      Your resume on file will be used to calculate an AI match score for this position. Ready to submit your application?
                    </p>
                    {modalError && <div className="alert alert-danger">{modalError}</div>}
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-outline-secondary" onClick={closeModal} disabled={applyingJobId}>
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={confirmApply}
                        disabled={applyingJobId === modalJob._id}
                      >
                        {applyingJobId === modalJob._id ? 'Submitting & Scoring...' : 'Confirm Apply'}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h5 className="fw-bold mb-3">✅ Application Submitted!</h5>
                <div className="text-center mb-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success fw-bold mb-2"
                    style={{ width: '80px', height: '80px', fontSize: '1.5rem' }}
                  >
                    {modalResult.aiScore}%
                  </div>
                  <p className="text-muted small mb-0">AI Match Score</p>
                </div>
                <p className="text-center">{modalResult.aiJustification}</p>
                <button className="btn btn-primary w-100 mt-2" onClick={closeModal}>
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