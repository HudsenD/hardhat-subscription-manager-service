// const { assert, expect } = require("chai")
// const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
// const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

// !developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("Complex Subscription Manager Tests", function () {
//           let complexSub, deployer, player
//           const PRICE = ethers.utils.parseEther("0.01")
//           const subId = "1"
//           provider = ethers.provider

//           beforeEach(async function () {
//               deployer = (await getNamedAccounts()).deployer
//               player = (await getNamedAccounts()).player
//               await deployments.fixture(["all"])
//               complexSub = await ethers.getContract("ComplexSubscriptionManager")
//           })
//           describe("createNewSubsrciption", function () {})

//           describe("cancelSubsrciption", function () {
//               it("reverts if caller is not subscription owner", async function () {
//                   await complexSub.becomeCompany()
//                   await complexSub.createNewSubsrciption(subId, PRICE)
//                   const complexSubPlayer = await ethers.getContract("ComplexSubscriptionManager", player)
//                   await expect(complexSubPlayer.cancelSubsrciption(subId)).to.be.revertedWith("NotSubscriptionOwner")
//               })
//           })
//       })
