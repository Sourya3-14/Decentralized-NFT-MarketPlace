import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { NFT_MARKETPLACE_ABI, BASIC_NFT_ABI } from "../constants/abis";
import Navbar from "../components/Navbar";
import "../styles/pages/Marketplace.css";

const Marketplace = () => {
  const marketplaceAddress = "0x7A65E80E6C332947b0CAc981095F48d6c65dc78D";
  const contractAddress = "0xa406F266db6Ab692f6f59f52dCd70238E77C14a2";

  const [allListedNFTs, setAllListedNFTs] = useState([]);
  const [currentTokenId, setCurrentTokenId] = useState(0);
  const [maxTokenId, setMaxTokenId] = useState(10);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [showMintForm, setShowMintForm] = useState(false);
  const [mintTokenURI, setMintTokenURI] = useState("");
  const [buyingTokenId, setBuyingTokenId] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Transaction receipt for tracking
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Get total supply to know how many tokens exist
  const { data: totalSupply } = useReadContract({
    address: contractAddress,
    abi: BASIC_NFT_ABI,
    functionName: "totalSupply",
    enabled: isConnected && !!contractAddress,
  });

  // Contract name
  const { data: contractName } = useReadContract({
    address: contractAddress,
    abi: BASIC_NFT_ABI,
    functionName: "name",
    enabled: isConnected && !!contractAddress,
  });

  // Get user's proceeds
  const { data: userProceeds, refetch: refetchProceeds } = useReadContract({
    address: marketplaceAddress,
    abi: NFT_MARKETPLACE_ABI,
    functionName: "getProceeds",
    args: [address],
    enabled: isConnected && !!address,
  });

  // Current token listing check
  const { data: listingData } = useReadContract({
    address: marketplaceAddress,
    abi: NFT_MARKETPLACE_ABI,
    functionName: "getListing",
    args: [contractAddress, BigInt(currentTokenId)],
    enabled: isConnected && isScanning && currentTokenId <= maxTokenId,
  });

  // Current token owner check
  const { data: nftOwner } = useReadContract({
    address: contractAddress,
    abi: BASIC_NFT_ABI,
    functionName: "ownerOf",
    args: [BigInt(currentTokenId)],
    enabled:
      isConnected &&
      isScanning &&
      currentTokenId <= maxTokenId &&
      listingData?.price &&
      listingData.price > 0n,
  });

  // Current token URI
  const { data: tokenUri } = useReadContract({
    address: contractAddress,
    abi: BASIC_NFT_ABI,
    functionName: "tokenURI",
    args: [BigInt(currentTokenId)],
    enabled:
      isConnected &&
      isScanning &&
      currentTokenId <= maxTokenId &&
      listingData?.price &&
      listingData.price > 0n,
  });

  // Fetch metadata when tokenUri changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!tokenUri || !listingData?.price || listingData.price === 0n) {
        return;
      }

      try {
        let url = tokenUri;
        if (url.startsWith("ipfs://")) {
          url = `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        // Add this NFT to our list
        const nftData = {
          tokenId: currentTokenId.toString(),
          price: listingData.price,
          owner: nftOwner,
          tokenUri,
          metadata: json,
          seller: listingData.seller,
          isOwnedByUser: nftOwner?.toLowerCase() === address?.toLowerCase(),
        };

        setAllListedNFTs((prev) => {
          // Avoid duplicates
          const exists = prev.find((nft) => nft.tokenId === nftData.tokenId);
          if (exists) return prev;
          return [...prev, nftData];
        });
      } catch (err) {
        console.error("Error fetching metadata:", err);
      }
    };

    fetchMetadata();
  }, [tokenUri, listingData, nftOwner, address, currentTokenId]);

  // Progress to next token
  useEffect(() => {
    if (!isScanning) return;

    const timer = setTimeout(() => {
      if (currentTokenId < maxTokenId) {
        setCurrentTokenId((prev) => prev + 1);
      } else {
        setIsScanning(false);
        setScanComplete(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentTokenId, maxTokenId, isScanning, listingData, nftOwner]);

  // Start scanning function
  const startScan = () => {
    setAllListedNFTs([]);
    setCurrentTokenId(0);
    setScanComplete(false);
    setIsScanning(true);
  };

  // Auto-start scan when connected
  useEffect(() => {
    if (isConnected && address && !isScanning && !scanComplete) {
      const effectiveMax = totalSupply ? Number(totalSupply) - 1 : maxTokenId;
      setMaxTokenId(effectiveMax);
      startScan();
    }
  }, [isConnected, address, totalSupply]);

  // Mint NFT function
  const handleMintNFT = async () => {
    if (!mintTokenURI.trim()) {
      alert("Please enter a token URI");
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: BASIC_NFT_ABI,
        functionName: "mintNft",
        args: [mintTokenURI],
      });
      setMintTokenURI("");
      setShowMintForm(false);
    } catch (error) {
      console.error("Minting error:", error);
      alert("Error minting NFT");
    }
  };

  // Buy NFT function
  const handleBuyNFT = async (nft) => {
    setBuyingTokenId(nft.tokenId);
    try {
      writeContract({
        address: marketplaceAddress,
        abi: NFT_MARKETPLACE_ABI,
        functionName: "buyItem",
        args: [contractAddress, BigInt(nft.tokenId)],
        value: nft.price,
      });
    } catch (error) {
      console.error("Buying error:", error);
      alert("Error buying NFT");
      setBuyingTokenId(null);
    }
  };

  // Withdraw proceeds function
  const handleWithdrawProceeds = async () => {
    setIsWithdrawing(true);
    try {
      writeContract({
        address: marketplaceAddress,
        abi: NFT_MARKETPLACE_ABI,
        functionName: "withdrawProceeds",
      });
    } catch (error) {
      console.error("Withdraw error:", error);
      alert("Error withdrawing proceeds");
      setIsWithdrawing(false);
    }
  };

  // Reset states when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      setBuyingTokenId(null);
      setIsWithdrawing(false);
      refetchProceeds();
      // Optionally refresh the marketplace
      setTimeout(() => {
        startScan();
      }, 2000);
    }
  }, [isConfirmed]);

  if (!isConnected) {
    return (
      <div>
        <Navbar />
        <div className="not-connected">
          <h2>NFT Marketplace</h2>
          <p>Please connect your wallet to access the marketplace.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="marketplace-container">
        <div className="marketplace-header">
          <h1>NFT Marketplace</h1>
          <p className="contract-info">
            Contract: {contractName || contractAddress}
          </p>

          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => setShowMintForm(!showMintForm)}
            >
              {showMintForm ? "Cancel" : "Mint NFT"}
            </button>

            {userProceeds && userProceeds > 0n && (
              <button
                className="btn btn-success"
                onClick={handleWithdrawProceeds}
                disabled={isWithdrawing || isPending}
              >
                {isWithdrawing || isPending
                  ? "Withdrawing..."
                  : `Withdraw ${formatEther(userProceeds)} ETH`}
              </button>
            )}
          </div>
        </div>

        {/* Mint NFT Form */}
        {showMintForm && (
          <div className="mint-form">
            <h3>Mint New NFT</h3>
            <div className="form-group">
              <label>Token URI (IPFS or HTTP):</label>
              <input
                type="text"
                value={mintTokenURI}
                onChange={(e) => setMintTokenURI(e.target.value)}
                placeholder="ipfs://... or https://..."
                className="form-input"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleMintNFT}
              disabled={isPending || !mintTokenURI.trim()}
            >
              {isPending ? "Minting..." : "Mint NFT"}
            </button>
          </div>
        )}

        {/* Transaction Status */}
        {hash && (
          <div className="transaction-status">
            {isConfirming && <p>⏳ Waiting for confirmation...</p>}
            {isConfirmed && <p>✅ Transaction confirmed!</p>}
            {error && <p>❌ Error: {error.shortMessage || error.message}</p>}
          </div>
        )}

        {/* Scan Controls */}
        <div className="scan-controls">
          <div className="input-group">
            <label>Max Token ID to scan: </label>
            <input
              type="number"
              value={maxTokenId}
              onChange={(e) => setMaxTokenId(Number(e.target.value))}
              disabled={isScanning}
              className="token-input"
            />
            <button
              onClick={startScan}
              disabled={isScanning}
              className={`scan-button ${isScanning ? "disabled" : ""}`}
            >
              {isScanning ? "Scanning..." : "Refresh Marketplace"}
            </button>
          </div>

          {totalSupply && (
            <p className="total-supply">
              Total NFTs in collection: {totalSupply.toString()}
            </p>
          )}

          {isScanning && (
            <div className="progress-container">
              <p>
                Progress: {currentTokenId} / {maxTokenId}
              </p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(currentTokenId / maxTokenId) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Listed NFTs Display */}
        {allListedNFTs.length > 0 ? (
          <div className="marketplace-content">
            <h3>Listed NFTs ({allListedNFTs.length} found):</h3>
            <div className="nft-grid">
              {allListedNFTs.map((nft) => (
                <div key={nft.tokenId} className="marketplace-nft-card">
                  <div className="nft-header">
                    <h4>Token #{nft.tokenId}</h4>
                    {nft.isOwnedByUser && (
                      <span className="owner-badge">Your NFT</span>
                    )}
                  </div>

                  {nft.metadata && nft.metadata.image && (
                    <div className="image-container">
                      <img
                        src={
                          nft.metadata.image.startsWith("ipfs://")
                            ? `https://ipfs.io/ipfs/${nft.metadata.image.replace(
                                "ipfs://",
                                ""
                              )}`
                            : nft.metadata.image
                        }
                        alt={nft.metadata.name || `NFT #${nft.tokenId}`}
                        className="nft-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <div className="image-error">
                        <p>🖼️ Image failed to load</p>
                      </div>
                    </div>
                  )}

                  <div className="nft-details">
                    <p className="nft-name">
                      <strong>
                        {nft.metadata?.name || `NFT #${nft.tokenId}`}
                      </strong>
                    </p>

                    {nft.metadata?.description && (
                      <p className="nft-description">
                        {nft.metadata.description}
                      </p>
                    )}

                    <div className="price-section">
                      <p className="current-price">
                        <strong>Price: </strong>
                        <span className="price">
                          {formatEther(nft.price)} ETH
                        </span>
                      </p>
                      <p className="seller-info">
                        <strong>Seller: </strong>
                        <span className="seller-address">
                          {nft.seller?.slice(0, 6)}...{nft.seller?.slice(-4)}
                        </span>
                      </p>
                    </div>

                    {nft.metadata?.attributes &&
                      nft.metadata.attributes.length > 0 && (
                        <div className="attributes-container">
                          <strong>Traits:</strong>
                          <div className="attributes">
                            {nft.metadata.attributes
                              .slice(0, 4)
                              .map((attr, index) => (
                                <span key={index} className="attribute-tag">
                                  {attr.trait_type}: {attr.value}
                                </span>
                              ))}
                            {nft.metadata.attributes.length > 4 && (
                              <span className="attribute-tag more">
                                +{nft.metadata.attributes.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Buy Button - Only show if not owned by current user */}
                    {!nft.isOwnedByUser && (
                      <button
                        className="buy-button"
                        onClick={() => handleBuyNFT(nft)}
                        disabled={buyingTokenId === nft.tokenId || isPending}
                      >
                        {buyingTokenId === nft.tokenId
                          ? "Buying..."
                          : `Buy for ${formatEther(nft.price)} ETH`}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : scanComplete ? (
          <div className="no-results">
            <p>📭 No NFTs currently listed on the marketplace.</p>
            <p>
              Scanned tokens 0 to {maxTokenId}. Try adjusting the range or check
              back later.
            </p>
          </div>
        ) : !isScanning ? (
          <div className="no-results">
            <p>Click "Refresh Marketplace" to load all listed NFTs.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Marketplace;
