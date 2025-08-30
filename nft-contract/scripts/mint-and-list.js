const { ethers,deployments } = require("hardhat");

async function mintAndList() {
  let nftMarketplace, basicNft;
  // await deployments.fixture(["all"]);

  const NftMarketplacedeployment = await deployments.get("NFTMarketplace");
  nftMarketplace = await ethers.getContractAt(
    "NFTMarketplace",
    NftMarketplacedeployment.address
  );
  const basicNftdeployment = await deployments.get("BasicNFT");
  basicNft = await ethers.getContractAt("BasicNFT", basicNftdeployment.address);

  console.log("Minting...");
  const mintTx = await basicNft.mintNft({gasPrice: 30000000000});
  const mintTxReceipt = await mintTx.wait(); //wait for 1 block confirmation
  const tokenId = mintTxReceipt.logs[0].args.tokenId;
  console.log(`Minted NFT with tokenId: ${tokenId}`);
  console.log("Approving NFT...");
  const approveTx = await basicNft.approve(nftMarketplace.target, tokenId, {
    gasPrice: 30000000000,
  });
  await approveTx.wait(1);
  console.log("Listing NFT...");
  const listPrice = ethers.parseEther("0.001");
  const listTx = await nftMarketplace.listItem(
    basicNft.target,
    tokenId,
    listPrice,
    { gasPrice: 30000000000 }
  );
  await listTx.wait(1);
  console.log("NFT Listed!");
}
mintAndList()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
