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
import "../styles/pages/MyNFTs.css";

const MyNFTs = () => {
  const marketplaceAddress = "0x7A65E80E6C332947b0CAc981095F48d6c65dc78D";
  const contractAddress = "0xa406F266db6Ab692f6f59f52dCd70238E77C14a2";

  const [myListedNFTs, setMyListedNFTs] = useState([]);
  const [currentTokenId, setCurrentTokenId] = useState(0);
  const [maxTokenId, setMaxTokenId] = useState(10);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [updateErrors, setUpdateErrors] = useState({});
  const { address, isConnected } = useAccount();

  // Write contract hook for updating listings
  const {
    writeContract,
    data: updateHash,
    isPending: isUpdating,
    error: updateError,
  } = useWriteContract();

  // Wait for update transaction
  const { isLoading: isUpdateConfirming, isSuccess: isUpdateSuccess } =
    useWaitForTransactionReceipt({
      hash: updateHash,
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
      listingData.price > 0n &&
      nftOwner?.toLowerCase() === address?.toLowerCase(),
  });

  // Handle successful update
  useEffect(() => {
    if (isUpdateSuccess) {
      // Reset editing state
      setEditingTokenId(null);
      setNewPrice("");
      setUpdateErrors({});

      // Refresh the listing by restarting scan
      setTimeout(() => {
        startScan();
      }, 1000);
    }
  }, [isUpdateSuccess]);

  // Handle update errors
  useEffect(() => {
    if (updateError) {
      setUpdateErrors((prev) => ({
        ...prev,
        [editingTokenId]: updateError.message || "Failed to update listing",
      }));
    }
  }, [updateError, editingTokenId]);

  // Update listing function
  const handleUpdateListing = async (tokenId) => {
    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
      setUpdateErrors((prev) => ({
        ...prev,
        [tokenId]: "Please enter a valid price greater than 0",
      }));
      return;
    }

    try {
      setUpdateErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[tokenId];
        return newErrors;
      });

      const priceInWei = parseEther(newPrice);

      writeContract({
        address: marketplaceAddress,
        abi: NFT_MARKETPLACE_ABI,
        functionName: "updateListing",
        args: [contractAddress, BigInt(tokenId), priceInWei],
      });
    } catch (error) {
      setUpdateErrors((prev) => ({
        ...prev,
        [tokenId]: error.message || "Failed to update listing",
      }));
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTokenId(null);
    setNewPrice("");
    setUpdateErrors({});
  };

  // Start editing
  const handleStartEdit = (tokenId, currentPrice) => {
    setEditingTokenId(tokenId);
    setNewPrice(formatEther(currentPrice));
    setUpdateErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[tokenId];
      return newErrors;
    });
  };

  // Fetch metadata when tokenUri changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (
        !tokenUri ||
        !listingData?.price ||
        listingData.price === 0n ||
        nftOwner?.toLowerCase() !== address?.toLowerCase()
      ) {
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
        };

        setMyListedNFTs((prev) => {
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
    }, 500); // Small delay to avoid overwhelming RPC

    return () => clearTimeout(timer);
  }, [currentTokenId, maxTokenId, isScanning, listingData, nftOwner]);

  // Start scanning function
  const startScan = () => {
    setMyListedNFTs([]);
    setCurrentTokenId(0);
    setScanComplete(false);
    setIsScanning(true);
    // Reset update states when starting new scan
    setEditingTokenId(null);
    setNewPrice("");
    setUpdateErrors({});
  };

  // Auto-start scan when connected
  useEffect(() => {
    if (isConnected && address && !isScanning && !scanComplete) {
      const effectiveMax = totalSupply ? Number(totalSupply) - 1 : maxTokenId;
      setMaxTokenId(effectiveMax);
      startScan();
    }
  }, [isConnected, address, totalSupply]);

  if (!isConnected) {
    return (
      <div>
        <Navbar />
        <div className="not-connected">
          <h2>My Listed NFTs</h2>
          <p>Please connect your wallet to view your listed NFTs.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>My Listed NFTs</h1>
        <p className="contract-info">
          Contract: {contractName || contractAddress}
        </p>

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
              {isScanning ? "Scanning..." : "Start New Scan"}
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

        {myListedNFTs.length > 0 ? (
          <div>
            <h3>Your Listed NFTs ({myListedNFTs.length} found):</h3>
            <div className="nft-grid">
              {myListedNFTs.map((nft) => (
                <div key={nft.tokenId} className="nft-card">
                  <h4>Token #{nft.tokenId}</h4>

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
                    <p>
                      <strong>Name:</strong>{" "}
                      {nft.metadata?.name || `NFT #${nft.tokenId}`}
                    </p>
                    {nft.metadata?.description && (
                      <p>
                        <strong>Description:</strong> {nft.metadata.description}
                      </p>
                    )}

                    {/* Price section with edit functionality */}
                    <div className="price-section">
                      {editingTokenId === nft.tokenId ? (
                        <div className="price-edit">
                          <label>
                            <strong>New Price (ETH):</strong>
                          </label>
                          <div className="price-edit-controls">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              placeholder="Enter price in ETH"
                              className="price-input"
                              disabled={isUpdating || isUpdateConfirming}
                            />
                            <div className="price-edit-buttons">
                              <button
                                onClick={() => handleUpdateListing(nft.tokenId)}
                                disabled={
                                  isUpdating || isUpdateConfirming || !newPrice
                                }
                                className="update-button"
                              >
                                {isUpdating || isUpdateConfirming
                                  ? "Updating..."
                                  : "Update"}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isUpdating || isUpdateConfirming}
                                className="cancel-button"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          {updateErrors[nft.tokenId] && (
                            <p className="error-message">
                              {updateErrors[nft.tokenId]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="price-display">
                          <p>
                            <strong>Price:</strong>{" "}
                            <span className="price">
                              {formatEther(nft.price)} ETH
                            </span>
                            <button
                              onClick={() =>
                                handleStartEdit(nft.tokenId, nft.price)
                              }
                              className="edit-price-button"
                              disabled={isUpdating || isUpdateConfirming}
                            >
                              ✏️ Edit Price
                            </button>
                          </p>
                        </div>
                      )}
                    </div>

                    {nft.metadata?.attributes &&
                      nft.metadata.attributes.length > 0 && (
                        <div className="attributes-container">
                          <strong>Traits:</strong>
                          <div className="attributes">
                            {nft.metadata.attributes.map((attr, index) => (
                              <span key={index} className="attribute-tag">
                                {attr.trait_type}: {attr.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : scanComplete ? (
          <div className="no-results">
            <p>📭 No NFTs found that are both listed and owned by you.</p>
            <p>
              Scanned tokens 0 to {maxTokenId}. You can adjust the range and
              scan again.
            </p>
          </div>
        ) : !isScanning ? (
          <div className="no-results">
            <p>Click "Start New Scan" to find your listed NFTs.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MyNFTs;
