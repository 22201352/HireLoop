'use client';

import { useState } from 'react';

export default function ComplaintModal({
  triggerLabel = 'Report issue',
  buttonClassName = 'btn btn-outline-danger btn-sm',
  currentUser,
  targetType = 'job',
  targetRole = '',
  allowTargetRoleSelection = false,
  targetOptions = [],
  targetId = '',
  targetName = '',
  onSubmitted,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const initialTarget = targetOptions[0] || { type: targetType, role: targetRole, id: targetId, name: targetName };
  const [formData, setFormData] = useState({
    category: 'Other',
    description: '',
    targetType: initialTarget.type,
    targetRole: initialTarget.role || (initialTarget.type === 'job' ? 'job' : 'user'),
    targetId: initialTarget.id || '',
    targetName: initialTarget.name || '',
    evidence: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'evidence') {
      setFormData((prev) => ({ ...prev, evidence: files[0] || null }));
      return;
    }

    if (name === 'targetType' && targetOptions.length) {
      const selectedTarget = targetOptions.find((option) => `${option.type}-${option.role}` === value);
      setFormData((prev) => ({
        ...prev,
        targetType: selectedTarget?.type || prev.targetType,
        targetRole: selectedTarget?.role || (selectedTarget?.type === 'job' ? 'job' : 'user'),
        targetId: selectedTarget?.id || '',
        targetName: selectedTarget?.name || '',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      category: 'Other',
      description: '',
      targetType: initialTarget.type,
      targetRole: initialTarget.role || (initialTarget.type === 'job' ? 'job' : 'user'),
      targetId: initialTarget.id || '',
      targetName: initialTarget.name || '',
      evidence: null,
    });
    setError('');
    setSuccess(false);
  };

  const closeModal = () => {
    setOpen(false);
    setLoading(false);
    setTimeout(resetForm, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('complainantId', currentUser._id);
      payload.append('complainantName', currentUser.name || 'User');
      payload.append('complainantRole', currentUser.role || 'candidate');
      payload.append('complainantDashboard', currentUser.role || 'candidate');
      payload.append('targetType', formData.targetType);
      payload.append('targetRole', formData.targetRole);
      payload.append('targetId', formData.targetId || targetId || '');
      payload.append('targetName', formData.targetName || targetName || '');
      payload.append('category', formData.category);
      payload.append('description', formData.description);

      if (formData.evidence) {
        payload.append('evidence', formData.evidence);
      }

      const res = await fetch('/api/complaints', {
        method: 'POST',
        body: payload,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to submit complaint');
        return;
      }

      setSuccess(true);
      if (onSubmitted) onSubmitted();
      setTimeout(() => closeModal(), 1200);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setOpen(true)}
        title={triggerLabel}
        aria-label={triggerLabel}
      >
        {compact ? '⚑' : triggerLabel}
      </button>

      {open && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={closeModal}
        >
          <div className="card shadow-lg p-4" style={{ width: '90%', maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Submit Complaint</h5>
              <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
            </div>

            {success ? (
              <div className="alert alert-success mb-0">Complaint submitted successfully.</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {!targetId && (
                    <div className="col-md-6">
                      <label className="form-label">Target Type</label>
                      <select
                        className="form-select"
                        name="targetType"
                        value={targetOptions.length ? `${formData.targetType}-${formData.targetRole}` : formData.targetType}
                        onChange={handleChange}
                      >
                        {targetOptions.length ? (
                          targetOptions.map((option) => (
                            <option key={`${option.type}-${option.role}`} value={`${option.type}-${option.role}`}>{option.label}</option>
                          ))
                        ) : (
                          <>
                            <option value="job">Job</option>
                            <option value="user">User</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {allowTargetRoleSelection && !targetId && formData.targetType === 'user' && (
                    <div className="col-md-6">
                      <label className="form-label">User Role</label>
                      <select
                        className="form-select"
                        name="targetRole"
                        value={formData.targetRole}
                        onChange={handleChange}
                      >
                        <option value="candidate">Candidate</option>
                        <option value="recruiter">Recruiter</option>
                      </select>
                    </div>
                  )}

                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option>Harassment</option>
                      <option>Spam</option>
                      <option>Fake/Fraud</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Target Name</label>
                    <input
                      className="form-control"
                      name="targetName"
                      value={formData.targetName}
                      onChange={handleChange}
                      placeholder="Job title or user name"
                      required
                      readOnly={Boolean(targetName)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Target ID</label>
                    <input
                      className="form-control"
                      name="targetId"
                      value={formData.targetId}
                      onChange={handleChange}
                      placeholder="Job ID or user ID"
                      required
                      readOnly={Boolean(targetId)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      rows="5"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the issue in detail"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Evidence attachment (optional)</label>
                    <input
                      className="form-control"
                      type="file"
                      name="evidence"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
