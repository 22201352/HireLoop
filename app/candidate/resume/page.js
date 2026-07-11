'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResumeUploadPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingResume, setExistingResume] = useState(null);
  const [checkingResume, setCheckingResume] = useState(true);

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
    checkExistingResume(parsedUser._id);
  }, [router]);

  const checkExistingResume = async (candidateId) => {
    try {
      const res = await fetch(`/api/resume?candidateId=${candidateId}`);
      const data = await res.json();
      if (data.resume) {
        setExistingResume(data.resume);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingResume(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError('');
    if (selected && selected.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('candidateId', user._id);

      const res = await fetch('/api/resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      setSuccess(true);
      setUploading(false);
      checkExistingResume(user._id);
    } catch (err) {
      setError('Something went wrong. Try again.');
      setUploading(false);
    }
  };

  if (!user || checkingResume) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f5ee 100%)', minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4 shadow-sm">
        <span className="navbar-brand fw-bold">HireLoop</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <Link href="/candidate/dashboard" className="btn btn-outline-light btn-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="text-center mb-4">
              <h2 className="fw-bold text-primary">Your Resume</h2>
              <p className="text-muted">
                Upload your resume in PDF format. We&apos;ll use it to match you with the best job opportunities.
              </p>
            </div>

            {existingResume && (
              <div className="alert alert-info shadow-sm d-flex align-items-center gap-2 mb-4">
                <span style={{ fontSize: '1.3rem' }}>📄</span>
                <div>
                  <strong>Resume on file.</strong>{' '}
                  <a href={existingResume.fileUrl} target="_blank" rel="noopener noreferrer">
                    View current resume
                  </a>
                </div>
              </div>
            )}

            {success && (
              <div className="alert alert-success shadow-sm d-flex align-items-center gap-2 mb-4">
                <span style={{ fontSize: '1.3rem' }}>✅</span>
                <div>Resume uploaded and processed successfully!</div>
              </div>
            )}

            {error && <div className="alert alert-danger shadow-sm">{error}</div>}

            <div className="card border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleUpload}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      {existingResume ? 'Upload a New Resume (replaces current)' : 'Upload Resume (PDF only)'}
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="form-control form-control-lg"
                      onChange={handleFileChange}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 fw-semibold"
                    disabled={uploading}
                    style={{ borderRadius: '10px' }}
                  >
                    {uploading ? 'Uploading & Processing...' : 'Upload Resume'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}