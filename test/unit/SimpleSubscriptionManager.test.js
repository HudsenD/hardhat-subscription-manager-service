// const { assert, expect } = require("chai")
// const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
// const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

// !developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("Simple Subscription Manager Tests", function () {
//           let simpleSub, deployer, player, simpleSubPlayer
//           const PRICE = ethers.utils.parseEther("0.01")
//           provider = ethers.provider

//           beforeEach(async function () {
//               deployer = (await getNamedAccounts()).deployer
//               player = (await getNamedAccounts()).player
//               await deployments.fixture(["all"])
//               simpleSub = await ethers.getContract("SimpleSubscriptionManager")
//               simpleSubPlayer = await ethers.getContract("SimpleSubscriptionManager", player)
//           })
//           describe("userDeposit", function () {
//               it("updates user balance correctly", async function () {
//                   await simpleSub.userDeposit({ value: PRICE })
//                   initialBalance = (await simpleSub.getUserInfo(deployer)).balance
//                   await simpleSub.userDeposit({ value: PRICE })
//                   newBalance = (await simpleSub.getUserInfo(deployer)).balance
//                   balanceChange = newBalance - initialBalance
//                   assert.equal(balanceChange.toString(), PRICE)
//               })

//               it("reverts if no value is deposited", async function () {
//                   await expect(simpleSub.userDeposit()).to.be.revertedWith("NoValue")
//               })
//           })
//           describe("becomeCompany", function () {
//               it("registers msg.sender as a company", async function () {
//                   await simpleSub.becomeCompany()
//                   isCompany = (await simpleSub.getCompanyInfo(deployer)).isCompany
//                   assert.equal(true, isCompany)
//               })
//               it("reverts if msg.sender is already a company", async function () {
//                   await simpleSub.becomeCompany()
//                   await expect(simpleSub.becomeCompany()).to.be.revertedWith("AlreadyCompany")
//               })
//           })
//           describe("cancelSubsrciption", function () {
//               it("changes isCompany of a address to false", async function () {
//                   await simpleSub.becomeCompany()
//                   await simpleSub.cancelCompany()
//                   isCompany = (await simpleSub.getCompanyInfo(deployer)).isCompany
//                   assert.equal(false, isCompany)
//               })
//           })
//           describe("subscribe", function () {
//               it("reverts if input address is not a company", async function () {
//                   await expect(simpleSub.subscribe(player)).to.be.revertedWith("NotValidCompany")
//               })
//               it("updates subscription status for inputed company to true", async function () {
//                   simpleSubPlayer.becomeCompany()
//                   await simpleSub.subscribe(player)
//                   subscriptionStatus = await simpleSub.getSubscriptionStatus(player)
//                   assert.equal(true, subscriptionStatus)
//               })
//               it("reverts if user is already subscribed to company", async function () {
//                   simpleSubPlayer.becomeCompany()
//                   await simpleSub.subscribe(player)
//                   await expect(simpleSub.subscribe(player)).to.be.revertedWith("AlreadySubscribed")
//               })
//               it("updates company subscriber count", async function () {
//                   simpleSubPlayer.becomeCompany()
//                   //subCountBefore = (await simpleSub.getCompanyInfo(player)
//                   await simpleSub.subscribe(player)
//                   subCount = (await simpleSub.getCompanyInfo(player)).subscriberCount
//                   assert.equal(subCount.toString(), "1")
//               })
//           })
//       })
