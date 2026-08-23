'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminJobVerificationPage() {
  const router = useRouter();
  const params = useParams();
  const [job, setJob] = useState(null);
  const [recruiter, setRecruiter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('hireloop_user');
    if (!storedUser || JSON.parse(storedUser).role !== 'admin') {
      router.push('/login');
      return;
    }

    fetch(`/api/admin/jobs?jobId=${params.id}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setJob(data.job);
        setRecruiter(data.recruiter);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}><div className="spinner-border text-primary" role="status" /></div>;
  }

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold">HireLoop Admin</span>
        <Link href="/admin/complaints" className="btn btn-outline-light btn-sm">Back to Complaints</Link>
      </nav>
      <main className="container py-4">
        {!job ? <div className="alert alert-warning">Job listing not found.</div> : (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <div><h4 className="fw-bold mb-1">{job.title}</h4><div className="text-muted">{job.companyName}</div></div>
                  <span className="badge bg-secondary text-capitalize">{job.status}</span>
                </div>
                <div className="card-body">
                  <div className="small text-muted mb-3">{job.employmentType} · {job.experienceLevel} · Salary ৳{job.salaryMin?.toLocaleString()} - ৳{job.salaryMax?.toLocaleString()}</div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{job.description}</p>
                  <strong>Skills</strong><div className="mt-2">{job.skills?.map((skill) => <span key={skill} className="badge bg-light text-dark border me-1">{skill}</span>)}</div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-header bg-white fw-bold">Recruiter verification</div>
                <div className="card-body">{recruiter ? <><h5>{recruiter.name}</h5><p className="mb-1">{recruiter.designation} at {recruiter.companyName}</p><p className="small mb-2">{recruiter.businessEmail || recruiter.email}</p><Link href={`/admin/users/${recruiter._id}`} className="btn btn-outline-primary btn-sm">View confidential profile</Link></> : <span className="text-muted">Recruiter not found.</span>}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}