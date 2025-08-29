const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Nft Marketplace Unit Tests", function () {
      let nftMarketplace, basicNft;
      const PRICE = ethers.parseEther("0.001");
      const TOKEN_ID = 0;

      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        deployer = accounts[0];
        user = accounts[1];
        await deployments.fixture(["all"]);

        const basicNftdeployment = await deployments.get("BasicNFT");
        basicNft = await ethers.getContractAt(
          "BasicNFT",
          basicNftdeployment.address
        );
        const NftMarketplacedeployment =
          await deployments.get("NFTMarketplace");
        nftMarketplace = await ethers.getContractAt(
          "NFTMarketplace",
          NftMarketplacedeployment.address
        );

        await basicNft.mintNft(); // owner is deployer
        //aprove the marketplace to change the ownership of the nft
        await basicNft.approve(nftMarketplace.target, TOKEN_ID);
      });

      describe("listItem", function () {
        it("emits an event after listing an item", async function () {
          await expect(
            nftMarketplace.listItem(basicNft.target, TOKEN_ID, Number(PRICE))
          ).to.emit(nftMarketplace, "ItemListed");
        });
        it("exclusively items that haven't been listed", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          const error = `AlreadyListed("${basicNft.target}", ${TOKEN_ID})`;
          await expect(
            nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__AlreadyListed"
          );
        });
        it("exclusively allows owners to list", async function () {
          const nftMarket = nftMarketplace.connect(user);
          await basicNft.approve(nftMarket.target, TOKEN_ID);
          await expect(
            nftMarket.listItem(basicNft.target, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NotOwner"
          );
        });
        it("needs approvals to list item", async function () {
          await basicNft.approve(ethers.ZeroAddress, TOKEN_ID);
          await expect(
            nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NotApprovedForMarketplace"
          );
        });
        it("Updates listing with seller and price", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          const listing = await nftMarketplace.getListing(
            basicNft.target,
            TOKEN_ID
          );
          assert(listing.price.toString() == PRICE.toString());
          assert(listing.seller.toString() == deployer.address);
        });
        it("reverts if the price be 0", async () => {
          const ZERO_PRICE = ethers.parseEther("0");
          await expect(
            nftMarketplace.listItem(basicNft.target, TOKEN_ID, ZERO_PRICE)
          ).revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__PriceMustBeAboveZero"
          );
        });
      });
      describe("cancelListing", function () {
        it("reverts if there is no listing", async function () {
          await expect(
            nftMarketplace.cancelListing(basicNft.target, TOKEN_ID)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NotListed"
          );
        });
        it("reverts if anyone but the owner tries to call", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          const nftMarket = nftMarketplace.connect(user);
          await basicNft.approve(nftMarket.target, TOKEN_ID);
          await expect(
            nftMarket.cancelListing(basicNft.target, TOKEN_ID)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NotOwner"
          );
        });
        it("emits event and removes listing", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.cancelListing(basicNft.target, TOKEN_ID)
          ).to.emit(nftMarketplace, "ItemRemoved");
          const listing = await nftMarketplace.getListing(
            basicNft.target,
            TOKEN_ID
          );
          assert(listing.price.toString() == "0");
        });
      });
      describe("buyItem", function () {
        it("reverts if the item isnt listed", async function () {
          await expect(
            nftMarketplace.buyItem(basicNft.target, TOKEN_ID)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NotListed"
          );
        });
        it("reverts if the price isnt met", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.buyItem(basicNft.target, TOKEN_ID)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__PriceNotMet"
          );
        });
        it("transfers the nft to the buyer and updates internal proceeds record", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          const nftMarket = nftMarketplace.connect(user);
          await expect(
            nftMarket.buyItem(basicNft.target, TOKEN_ID, {
              value: PRICE,
            })
          ).to.emit(nftMarket, "ItemBought");
          const newOwner = await basicNft.ownerOf(TOKEN_ID);
          const deployerProceeds = await nftMarket.getProceeds(
            deployer.address
          );
          assert(newOwner.toString() == user.address);
          assert(deployerProceeds.toString() == PRICE.toString());
        });
      });
      describe("updateListing", function () {
        it("must be owner and listed", async function () {
          await expect(
            nftMarketplace.updateListing(basicNft.target, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NotListed"
          );
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          const nftMarket = nftMarketplace.connect(user);
          await expect(
            nftMarket.updateListing(basicNft.target, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NotOwner"
          );
        });
        it("reverts if new price is 0", async function () {
          const updatedPrice = ethers.parseEther("0");
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.updateListing(
              basicNft.target,
              TOKEN_ID,
              updatedPrice
            )
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__PriceMustBeAboveZero"
          );
        });
        it("updates the price of the item", async function () {
          const updatedPrice = ethers.parseEther("0.002");
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          expect(
            await nftMarketplace.updateListing(
              basicNft.target,
              TOKEN_ID,
              updatedPrice
            )
          ).to.emit("ItemListed");
          const listing = await nftMarketplace.getListing(
            basicNft.target,
            TOKEN_ID
          );
          assert(listing.price.toString() == updatedPrice.toString());
        });
      });
      describe("withdrawProceeds", function () {
        it("doesn't allow 0 proceed withdrawls", async function () {
          await expect(
            nftMarketplace.withdrawProceeds()
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "NFTMarketplace__NoProceeds"
          );
        });
        it("withdraws proceeds", async function () {
          await nftMarketplace.listItem(basicNft.target, TOKEN_ID, PRICE);
          let nftMarket = nftMarketplace.connect(user);
          await nftMarket.buyItem(basicNft.target, TOKEN_ID, {
            value: PRICE,
          });
          nftMarket = nftMarketplace.connect(deployer);

          const deployerProceedsBefore = await nftMarket.getProceeds(
            deployer.address
          );
          const deployerBalanceBefore = await ethers.provider.getBalance(
            deployer.address
          );
          const txResponse = await nftMarket.withdrawProceeds();
          const transactionReceipt = await txResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt; // Use gasPrice instead of effectiveGasPrice
          const gasCost = BigInt(gasUsed) * BigInt(gasPrice); // Ensure both are BigInt
          const deployerBalanceAfter = await ethers.provider.getBalance(
            deployer.address
          );

          assert(
            (deployerBalanceAfter + gasCost).toString() ===
              (deployerProceedsBefore + deployerBalanceBefore).toString()
          );
        });
      });
    });
