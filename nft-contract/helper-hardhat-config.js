const { parseEther } = require("ethers");

const networkConfig = {
  11155111: {
    name: "sepolia",
    vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
    mintFee: parseEther("0.001"),
    gasLane:
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", //500 gwei Key Hash of sepolia
    subscriptionId:
      "96953916105162490016307272195727599139644894232947591889193268513634181742277", //last 4 digits of the subid
    priceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
  31337: {
    name: "hardhat",
    vrfCoordinatorV2: "",
    mintFee: parseEther("0.001"),
    gasLane:
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", //750 gwei Key Hash of sepolia
    subscriptionId: "",
    priceFeed: "",
  },
};
const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
