import React from "react";

import Navbar from "../components/Navbar";
import "../styles/pages/LandingPage.css";
// Hero Section Component
function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Discover, Create & Collect
            <span className="highlight"> Digital Art</span>
          </h1>
          <p className="hero-subtitle">
            The world's first and largest digital marketplace for crypto
            collectibles and non-fungible tokens (NFTs). Buy, sell, and discover
            exclusive digital items.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => (window.location.href = "/marketplace")}
            >
              Explore Marketplace
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => (window.location.href = "/mint")}
            >
              Create NFT
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-cards">
            <div className="nft-preview-card card-1">
              <div className="preview-image">
                <span>🖼️</span>
              </div>
              <div className="preview-info">
                <h4>Digital Art</h4>
                <p>0.5 ETH</p>
              </div>
            </div>
            <div className="nft-preview-card card-2">
              <div className="preview-image">
                <span>🎵</span>
              </div>
              <div className="preview-info">
                <h4>Music NFT</h4>
                <p>1.2 ETH</p>
              </div>
            </div>
            <div className="nft-preview-card card-3">
              <div className="preview-image">
                <span>🎮</span>
              </div>
              <div className="preview-info">
                <h4>Gaming Asset</h4>
                <p>0.8 ETH</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section Component
function FeaturesSection() {
  const features = [
    {
      icon: "🎨",
      title: "Create & Mint",
      description:
        "Turn your creative works into NFTs and sell them to a global audience.",
    },
    {
      icon: "🛒",
      title: "Buy & Sell",
      description:
        "Discover and collect unique digital assets from creators worldwide.",
    },
    {
      icon: "🔒",
      title: "Secure & Verified",
      description:
        "All transactions are secured by blockchain technology and smart contracts.",
    },
    {
      icon: "🌍",
      title: "Global Community",
      description:
        "Join a vibrant community of creators, collectors, and digital art enthusiasts.",
    },
  ];

  return (
    <section className="features-section">
      <div className="container">
        <h2 className="section-title">Why Choose Our Platform?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Stats Section Component
function StatsSection() {
  const stats = [
    { number: "10K+", label: "NFTs Created" },
    { number: "5K+", label: "Active Users" },
    { number: "100+", label: "Featured Artists" },
    { number: "50ETH+", label: "Total Volume" },
  ];

  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <h3 className="stat-number">{stat.number}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section Component
function CTASection() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>
            Join thousands of creators and collectors in the digital art
            revolution.
          </p>
          <div className="cta-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => (window.location.href = "/marketplace")}
            >
              Start Exploring
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>NFT Marketplace</h3>
            <p>Discover, create, and collect digital art NFTs.</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Marketplace</h4>
              <a href="/marketplace">Browse NFTs</a>
              <a href="/mint">Create NFT</a>
            </div>
            <div className="link-group">
              <h4>Support</h4>
              <a href="/help">Help Center</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 NFT Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
