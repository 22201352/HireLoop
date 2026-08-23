'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyComplaintsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('hireloop_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (!['candidate', 'recruiter'].includes(parsedUser.role)) {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchComplaints = async () => {
      try {
        const res = await fetch(`/api/complaints?filedBy=${user._id}`);
        const data = await res.json();
        setComplaints(data.complaints || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [user]);

  const statusBadge = (status) => {
    if (status === 'resolved') return <span className="badge bg-success">Resolved</span>;
    if (status === 'dismissed') return <span className="badge bg-secondary">Dismissed</span>;
    if (status === 'under_review' || status === 'warning_issued') return <span className="badge bg-info text-dark">Under review</span>;
    return <span className="badge bg-warning text-dark">Pending</span>;
  };

  if (!user) {
    return <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}><div className="spinner-border text-primary" role="status" /></div>;
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">HireLoop</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <Link href={user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard'} className="btn btn-outline-light btn-sm">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">My Complaints</h3>
        </div>

        <div className="card shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <p className="text-muted text-center py-5">Loading...</p>
            ) : complaints.length === 0 ? (
              <p className="text-muted text-center py-5">You have not filed any complaints yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Filed</th>
                      <th>Admin Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td>
                          <div className="fw-semibold">{complaint.targetName}</div>
                          <small className="text-muted text-capitalize">{complaint.targetType}</small>
                        </td>
                        <td>{complaint.category}</td>
                        <td>{statusBadge(complaint.status)}</td>
                        <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                        <td>{complaint.adminNote || '—'}</td>
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
