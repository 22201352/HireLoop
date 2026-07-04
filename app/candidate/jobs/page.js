'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BrowseJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [router]);

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
          <Link href="/candidate/dashboard" className="btn btn-outline-light btn-sm">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        <h3 className="fw-bold mb-4">Browse Jobs</h3>

        {/* Search & Filters */}
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

        {/* Results */}
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
            {jobs.map((job) => (
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
                    <button className="btn btn-primary w-100 mt-3">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}