import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f5ee 100%)' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg px-4 py-3">
        <span className="navbar-brand fw-bold fs-4 text-primary">HireLoop</span>
        <div className="ms-auto d-flex align-items-center gap-2">
          <Link href="/login" className="btn btn-outline-primary btn-sm px-3">
            Login
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm px-3">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container">
        <div className="row align-items-center" style={{ minHeight: '75vh' }}>
          <div className="col-lg-6">
            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2 mb-3 fw-semibold">
              ✨ AI-Powered Hiring
            </span>
            <h1 className="fw-bold mb-3" style={{ fontSize: '3rem', lineHeight: '1.2' }}>
              Where great talent <br />
              meets the <span className="text-primary">right opportunity</span>
            </h1>
            <p className="text-muted fs-5 mb-4">
              HireLoop connects candidates and recruiters through smart,
              AI-driven matching and making hiring faster, fairer and simpler
              for everyone.
            </p>

            <div className="d-flex gap-3 mb-5">
              <Link href="/register" className="btn btn-primary btn-lg px-4 fw-semibold shadow-sm">
                Get Started
              </Link>
              <Link href="/login" className="btn btn-outline-secondary btn-lg px-4 fw-semibold">
                Login
              </Link>
            </div>

            <div className="d-flex gap-4">
              <div>
                <h4 className="fw-bold text-primary mb-0">AI</h4>
                <p className="text-muted small mb-0">Resume Matching</p>
              </div>
              <div>
                <h4 className="fw-bold text-success mb-0">Fast</h4>
                <p className="text-muted small mb-0">Application Process</p>
              </div>
              <div>
                <h4 className="fw-bold text-warning mb-0">Secure</h4>
                <p className="text-muted small mb-0">Verified Recruiters</p>
              </div>
            </div>
          </div>

          <div className="col-lg-6 d-none d-lg-flex justify-content-center">
            <div
              className="card border-0 shadow-lg p-4"
              style={{ borderRadius: '20px', maxWidth: '380px', width: '100%' }}
            >
              <div className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                <div
                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ width: '48px', height: '48px' }}
                >
                  FD
                </div>
                <div>
                  <h6 className="fw-bold mb-0">Frontend Developer</h6>
                  <p className="text-muted small mb-0">TechCorp • Full-time</p>
                </div>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">AI Match Score</span>
                <span className="fw-bold text-success">92%</span>
              </div>
              <div className="progress mb-3" style={{ height: '8px', borderRadius: '10px' }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: '92%', borderRadius: '10px' }}
                />
              </div>
              <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 align-self-start">
                Shortlisted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-muted py-4 border-top mt-4">
        <small>© 2026 HireLoop. Built for smarter hiring.</small>
      </footer>
    </div>
  );
}