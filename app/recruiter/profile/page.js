'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EMPTY_FORM = {
  name: '',
  designation: '',
  phone: '',
  businessEmail: '',
  companyName: '',
  industry: '',
  website: '',
  description: '',
};

export default function RecruiterProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  // Same auth pattern as the dashboard.
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

  const loadProfile = useCallback(async (recruiterId) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/recruiter/profile?recruiterId=${recruiterId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load profile.");

      setProfile(data.profile);
      setForm({
        name: data.profile.name || '',
        designation: data.profile.designation || '',
        phone: data.profile.phone || '',
        businessEmail: data.profile.businessEmail || '',
        companyName: data.profile.companyName || '',
        industry: data.profile.industry || '',
        website: data.profile.website || '',
        description: data.profile.description || '',
      });
    } catch (err) {
      setError(err.message || 'Something went wrong loading your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?._id) loadProfile(user._id);
  }, [user, loadProfile]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        designation: profile.designation || '',
        phone: profile.phone || '',
        businessEmail: profile.businessEmail || '',
        companyName: profile.companyName || '',
        industry: profile.industry || '',
        website: profile.website || '',
        description: profile.description || '',
      });
    }
    setEditing(false);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    setSaving(true);
    setError('');
    setSavedMessage('');
    try {
      const res = await fetch('/api/recruiter/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterId: user._id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save changes.");

      setProfile(data.profile);
      setEditing(false);
      setSavedMessage('Profile updated.');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong saving your profile.');
    } finally {
      setSaving(false);
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

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-success px-4">
        <span className="navbar-brand fw-bold">HireLoop Recruiter</span>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-white">Hi, {user.name} ({user.companyName})</span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container py-4" style={{ maxWidth: '720px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link href="/recruiter/dashboard" className="text-decoration-none small text-muted">
              ← Back to Dashboard
            </Link>
            <h3 className="fw-bold mb-0 mt-1">Profile & Company Info</h3>
          </div>
          {!editing && !loading && profile && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>

        {savedMessage && (
          <div className="alert alert-success py-2">{savedMessage}</div>
        )}
        {error && (
          <div className="alert alert-danger py-2">{error}</div>
        )}

        <div className="card shadow-sm">
          <div className="card-body p-4">
            {loading ? (
              <p className="text-muted text-center py-4 mb-0">Loading profile...</p>
            ) : !profile ? (
              <p className="text-muted text-center py-4 mb-0">No profile found.</p>
            ) : editing ? (
              <form onSubmit={handleSave}>
                <FormField label="Name" value={form.name} onChange={(v) => handleChange('name', v)} />
                <FormField label="Designation" value={form.designation} onChange={(v) => handleChange('designation', v)} />
                <FormField label="Phone" value={form.phone} onChange={(v) => handleChange('phone', v)} />
                <FormField label="Business Email" type="email" value={form.businessEmail} onChange={(v) => handleChange('businessEmail', v)} />

                <hr className="my-4" />
                <h6 className="fw-bold text-muted text-uppercase small mb-3">Company Info</h6>

                <FormField label="Company Name" value={form.companyName} onChange={(v) => handleChange('companyName', v)} />
                <FormField label="Industry" value={form.industry} onChange={(v) => handleChange('industry', v)} />
                <FormField label="Website" type="url" value={form.website} onChange={(v) => handleChange('website', v)} />

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">Company Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2 pt-2">
                  <button type="submit" className="btn btn-primary btn-sm px-3" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <ReadRow label="Name" value={profile.name} />
                <ReadRow label="Designation" value={profile.designation} />
                <ReadRow label="Phone" value={profile.phone} />
                <ReadRow label="Business Email" value={profile.businessEmail} />

                <hr className="my-4" />
                <h6 className="fw-bold text-muted text-uppercase small mb-3">Company Info</h6>

                <ReadRow label="Company Name" value={profile.companyName} />
                <ReadRow label="Industry" value={profile.industry} />
                <ReadRow label="Website" value={profile.website} />
                <ReadRow label="Company Description" value={profile.description} last />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text' }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold small text-muted">{label}</label>
      <input
        type={type}
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ReadRow({ label, value, last = false }) {
  return (
    <div className={last ? 'mb-0' : 'mb-3'}>
      <div className="fw-bold small">{label}</div>
      <div className="text-primary">
        {value ? value : <span className="text-muted fst-italic">Not set</span>}
      </div>
    </div>
  );
}