const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Basic NFT Test", function () {
      let deployer, basicNFT;
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture("basicnft");

        const basicNftdeployment = await deployments.get("BasicNFT");
        basicNFT = await ethers.getContractAt(
          "BasicNFT",
          basicNftdeployment.address
        );
      });
      it("was deployed", async () => {
        assert(basicNFT.target);
      });
      describe("Constructor", function () {
        it("sets the s_tokenCounter perfectly", async () => {
          const count = await basicNFT.getTokenCounter();
          assert.equal(count.toString(), "0");
        });
        it("sets the correct name and symbol", async () => {
          const name = await basicNFT.name();
          const symbol = await basicNFT.symbol();

          assert.equal(name.toString(), "Doggie");
          assert.equal(symbol.toString(), "DOG");
        });
      });
      describe("Mint NFT", () => {
        beforeEach(async () => {
          const txResponse = await basicNFT.mintNft();
          await txResponse.wait(1);
        });
        it("Allows users to mint an NFT, and updates appropriately", async function () {
          const tokenURI = await basicNFT.tokenURI(0);
          const tokenCounter = await basicNFT.getTokenCounter();

          assert.equal(tokenCounter.toString(), "1");
          assert.equal(tokenURI, await basicNFT.TOKEN_URI());
        });
        it("Show the correct balance and owner of an NFT", async function () {
          const deployerBalance = await basicNFT.balanceOf(deployer);
          const owner = await basicNFT.ownerOf("0");

          assert.equal(deployerBalance.toString(), "1");
          assert.equal(owner, deployer);
        });
      });
    });
