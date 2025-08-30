import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import "../styles/components/Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Wallet connection state
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  // Main navigation items
  const navItems = [
    { path: "/market", label: "Marketplace" },
    { path: "/mynft", label: "My NFTs" },
  ];

  const isActive = (path) => location.pathname === path;

  // Close modal when connected
  useEffect(() => {
    if (isConnected) {
      setShowWalletOptions(false);
      setConnectionError(null);
    }
  }, [isConnected]);

  // Handle connection errors
  useEffect(() => {
    if (error) {
      setConnectionError(error);
      setTimeout(() => setConnectionError(null), 5000);
    }
  }, [error]);

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getConnectorIcon = (connectorName) => {
    const name = connectorName?.toLowerCase();
    if (name?.includes("metamask")) return "🦊";
    if (name?.includes("coinbase")) return "🔵";
    if (name?.includes("walletconnect")) return "🔗";
    return "💼";
  };

  const handleConnect = (connector) => {
    connect({ connector });
  };

  // Close wallet modal when clicking outside
  const handleModalOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      setShowWalletOptions(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-logo">
            {/* You can add an icon here if needed */}
          </div>
          <h2 className="navbar-title" onClick={() => navigate("/")}>
            NFT Marketplace
          </h2>
        </div>

        {/* Navigation Menu */}
        <div className="navbar-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? "active" : ""}`}
            >
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              {item.label}
            </Link>
          ))}
        </div>

        {/* Wallet Connection Section */}
        <div className="wallet-connector">
          {!isConnected ? (
            <div className="wallet-connect-section">
              {isPending ? (
                <div className="connecting-status">
                  <div className="loading-spinner"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletOptions(!showWalletOptions)}
                  className="connect-button"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          ) : (
            // Connected State
            <div className="connected-wallet">
              <div className="connection-indicator"></div>
              <span className="wallet-address">{formatAddress(address)}</span>
              <button
                onClick={() => disconnect()}
                className="disconnect-button"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Connection Error Toast */}
      {connectionError && (
        <div className="error-toast">
          <span className="error-icon">⚠️</span>
          <span className="error-text">
            {connectionError.code === 4001
              ? "Connection cancelled by user"
              : `Connection failed: ${connectionError.message}`}
          </span>
          <button
            onClick={() => setConnectionError(null)}
            className="error-close"
          >
            ×
          </button>
        </div>
      )}

      {/* Wallet Options Modal */}
      {showWalletOptions && !isPending && (
        <div className="modal-overlay" onClick={handleModalOverlayClick}>
          <div className="modal-content">
            <button
              onClick={() => setShowWalletOptions(false)}
              className="modal-close"
            >
              ×
            </button>

            <h2 className="modal-title">Connect your wallet</h2>

            <div className="wallet-grid">
              {connectors.length > 0 ? (
                connectors
                  .filter(
                    (connector, index, self) =>
                      self.findIndex((c) => c.name === connector.name) === index
                  )
                  .map((connector) => {
                    const displayName =
                      connector.name === "Injected"
                        ? "Browser Wallet"
                        : connector.name;

                    return (
                      <button
                        key={connector.uid}
                        onClick={() => handleConnect(connector)}
                        className="wallet-option"
                      >
                        <span className="wallet-icon">
                          {getConnectorIcon(connector.name)}
                        </span>
                        <div className="wallet-info">
                          <div className="wallet-name">{displayName}</div>
                        </div>
                      </button>
                    );
                  })
              ) : (
                <div className="loading-wallets">Loading wallets...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
