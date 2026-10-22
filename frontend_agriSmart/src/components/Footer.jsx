import React from "react";

function Footer() {
  return (
    <footer className="bg-light text-center py-4 border-top">
      <div className="mb-3">
        <a href="#" className="mx-3 text-muted small">Documentation</a>
        <a href="#" className="mx-3 text-muted small">Privacy Policy</a>
        <a href="#" className="mx-3 text-muted small">Support</a>
      </div>

      <h5 className="text-success fw-bold">AgriSmart</h5>

      <p className="small text-muted">
        © 2024 AgriSmart. Sustainable Tech for Agriculture.
      </p>
    </footer>
  );
}

export default Footer;