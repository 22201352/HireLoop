'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminUserVerificationPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('hireloop_user');
    if (!storedUser || JSON.parse(storedUser).role !== 'admin') {
      router.push('/login');
      return;
    }

    fetch(`/api/admin/users/${params.id}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setUser(data.user);
        setResume(data.resume);
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
        {!user ? (
          <div className="alert alert-warning">User not found.</div>
        ) : (
          <div className="card shadow-sm" style={{ maxWidth: '720px' }}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <div>
                <h4 className="fw-bold mb-1">Confidential user verification</h4>
                <span className="badge bg-secondary text-capitalize">{user.role}</span>
              </div>
              {user.isSuspended && <span className="badge bg-danger">Suspended</span>}
            </div>
            <div className="card-body">
              <dl className="row mb-0">
                <dt className="col-sm-4">Full name</dt><dd className="col-sm-8">{user.name || 'Not provided'}</dd>
                <dt className="col-sm-4">Login email</dt><dd className="col-sm-8">{user.email || 'Not provided'}</dd>
                <dt className="col-sm-4">Phone</dt><dd className="col-sm-8">{user.phone || 'Not provided'}</dd>
                {user.role === 'recruiter' && <>
                  <dt className="col-sm-4">Company</dt><dd className="col-sm-8">{user.companyName || 'Not provided'}</dd>
                  <dt className="col-sm-4">Designation</dt><dd className="col-sm-8">{user.designation || 'Not provided'}</dd>
                  <dt className="col-sm-4">Business email</dt><dd className="col-sm-8">{user.businessEmail || 'Not provided'}</dd>
                  <dt className="col-sm-4">Approval</dt><dd className="col-sm-8">{user.isApproved ? 'Approved' : 'Pending'}</dd>
                </>}
                <dt className="col-sm-4">Account created</dt><dd className="col-sm-8">{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Not available'}</dd>
              </dl>
              {user.role === 'candidate' && (
                <section className="border-top mt-4 pt-4">
                  <h5 className="fw-bold">Candidate resume</h5>
                  {resume ? (
                    <>
                      <p className="small text-muted">Updated {resume.updatedAt ? new Date(resume.updatedAt).toLocaleString() : 'Not available'}</p>
                      <a href={resume.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm mb-3">Open resume PDF</a>
                      {resume.parsedText && <p className="small bg-light border rounded p-3" style={{ maxHeight: '260px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{resume.parsedText}</p>}
                    </>
                  ) : <p className="text-muted">No resume was uploaded.</p>}
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}