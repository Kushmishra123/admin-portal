import React from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import '../styles/dashboard.css';

const AboutCompany = () => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title="About Company" subtitle="Discover Quisitive Businesses" />

        <div className="content-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Quisitive Businesses</h1>
              <p className="page-subtitle">Empowering businesses with advanced technology solutions</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* About Section */}
            <div className="form-card" style={{ gridColumn: '1 / -1' }}>
              <div className="settings-section-title">🏢 About Us</div>
              <p style={{ color: '#a3b5a3', lineHeight: '1.6', fontSize: '15px' }}>
                Quisitive Businesses is an IT services and data center solutions company that provides advanced technology solutions to help businesses run smoothly. The company focuses on secure, reliable, and scalable infrastructure to ensure data safety and high performance.
              </p>
            </div>

            {/* Mission Section */}
            <div className="form-card">
              <div className="settings-section-title">🎯 Our Mission</div>
              <p style={{ color: '#a3b5a3', lineHeight: '1.6', fontSize: '15px' }}>
                To provide reliable, innovative, and secure IT and data center solutions that support business growth and continuity.
              </p>
            </div>

            {/* Team Section */}
            <div className="form-card">
              <div className="settings-section-title">👥 Our Team</div>
              <p style={{ color: '#a3b5a3', lineHeight: '1.6', fontSize: '15px' }}>
                The company has experienced IT professionals who ensure high standards of security, performance, and service.
              </p>
            </div>

            {/* Services Section */}
            <div className="form-card" style={{ gridColumn: '1 / -1' }}>
              <div className="settings-section-title">🛠️ Our Services</div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px',
                marginTop: '10px'
              }}>
                {[
                  'Colocation Services',
                  'Cloud Solutions',
                  'Managed IT Services',
                  'Disaster Recovery',
                  'Cybersecurity & Compliance',
                  'IT Consulting & Support'
                ].map((service, index) => (
                  <div key={index} style={{
                    padding: '12px 16px',
                    background: 'rgba(118, 199, 51, 0.05)',
                    border: '1px solid rgba(118, 199, 51, 0.1)',
                    borderRadius: '8px',
                    color: '#e4ebe4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ color: '#76c733' }}>✓</span> {service}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="form-card" style={{ gridColumn: '1 / -1', background: 'linear-gradient(145deg, #111e14, #0a110b)' }}>
              <div className="settings-section-title">✨ Why Choose Us</div>
              <ul style={{ color: '#a3b5a3', lineHeight: '1.8', fontSize: '15px', paddingLeft: '20px', margin: 0 }}>
                <li><strong>24/7 Support:</strong> Always available to help your business stay online.</li>
                <li><strong>Security & Scalability:</strong> Focus on security, scalability, and performance to meet growing demands.</li>
                <li><strong>Industry Agnostic:</strong> Provides solutions for multiple industries including IT, healthcare, finance, and e-commerce.</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutCompany;
