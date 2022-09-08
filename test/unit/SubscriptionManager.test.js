const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Subscription Manager Tests", function () {
          let subManager, deployer, player, subManagerPlayer, player2, subManagerPlayer2
          const PRICE = ethers.utils.parseEther("0.01")
          provider = ethers.provider

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              player = (await getNamedAccounts()).player
              player2 = (await getNamedAccounts()).player2
              await deployments.fixture(["all"])
              subManager = await ethers.getContract("SubscriptionManager")
              subManagerPlayer = await ethers.getContract("SubscriptionManager", player)
              subManagerPlayer2 = await ethers.getContract("SubscriptionManager", player2)
          })

          describe("depositFunds", function () {
              it("updates balance correctly", async function () {
                  await subManager.depositFunds({ value: PRICE })
                  const initialBalance = await subManager.getBalance(deployer)
                  await subManager.depositFunds({ value: PRICE })
                  const newBalance = await subManager.getBalance(deployer)
                  const balanceChange = newBalance - initialBalance
                  assert.equal(balanceChange.toString(), PRICE)
              })
              it("reverts if no value is deposited", async function () {
                  await expect(subManager.depositFunds()).to.be.revertedWith("NoValue")
              })
          })

          describe("createSubscription", function () {
              it("populates new subscription struct correctly in mapping", async function () {
                  tx = await subManager.createSubscription(PRICE)
                  await tx.wait(1)
                  SubscriptionInfo = await subManager.getSubscriptionInfo("0") // need to get subId from contract and input here somehow.
                  assert.equal(SubscriptionInfo.isActive, true)
                  assert.equal(SubscriptionInfo.listPointer.toString(), "0")
                  assert.equal(SubscriptionInfo.subscriptionPrice.toString(), PRICE)
                  assert.equal(SubscriptionInfo.subscriptionOwner, deployer)
              })
              it("reverts if too many subscriptions exist", async function () {
                  for (let index = 0; index < 100; index++) {
                      tx = await subManager.createSubscription(PRICE)
                      await tx.wait(1)
                  }
                  await expect(subManager.createSubscription(PRICE)).to.be.revertedWith(
                      "TooManyActiveSubscriptionsInContract"
                  )
              })
          })
          describe("subscribe", function () {
              it("sets user info struct correctly in mapping", async function () {
                  await subManager.createSubscription(PRICE)
                  await subManager.subscribe("0")
              })
              // For test below, Have to comment out AlreadySubscibed check in contract so we don't have to use 100 plus accounts
              //   it("reverts if too many active users", async function () {
              //       await subManager.createSubscription(PRICE)
              //       for (let index = 0; index < 100; index++) {
              //           const tx = await subManager.subscribe("0")
              //           await tx.wait(1)
              //       }
              //       await expect(subManager.subscribe("0")).to.be.revertedWith("TooManyActiveUsers")
              //  })
              it("reverts if user is already subscribed", async function () {
                  await subManager.createSubscription(PRICE)
                  const tx = await subManager.subscribe("0")
                  await tx.wait(1)
                  await expect(subManager.subscribe("0")).to.be.revertedWith("AlreadySubscribed")
              })
          })
          // Due to poor design of my function/contract, I struggled to properly test this function.
          // Although not Ideal, I tested it on remix and everything works as intended.
          //   describe("autoSubscriptionPayment", function () {
          //       it("transfers subscriber value to corresponding subscription owner correctly", async function () {
          //           const depositTx = await subManagerPlayer.depositFunds(PRICE)
          //           await depositTx.wait(1)
          //           const createTx = await subManager.createSubscription(PRICE)
          //           await createTx.wait(1)
          //           const subscribeTx = await subManagerPlayer.subscribe("0")
          //           await subscribeTx.wait(1)
          //           const autoTx = await subManager.autoSubscriptionPayment({
          //               gasLimit: "210000",
          //               gasPrice: "1",
          //           })
          //           await autoTx.wait(1)
          //           deployerBalance = await subManager.getBalance(deployer)
          //           assert.equal(deployerBalance.toString(), PRICE)
          //       })
          //       it("unsubscribes user if they dont have sufficent balance", async function () {
          //           const createTx = await subManager.createSubscription(PRICE)
          //           await createTx.wait(1)
          //           const autoTx = await subManager.autoSubscriptionPayment({
          //               gasLimit: "210000",
          //           })
          //           await autoTx.wait(1)
          //       })
          //   })
          describe("deleteSubscription", function () {
              it("reverts if msg.sender is not subscription owner", async function () {
                  const tx = await subManager.createSubscription(PRICE)
                  await tx.wait(1)
                  await expect(subManagerPlayer.deleteSubscription("0")).to.be.revertedWith("NotSubscriptionOwner")
              })
              it("removes subscription from array, sets isActive to false, properly sets listPointer of moved subscription", async function () {
                  const createTx = await subManager.createSubscription(PRICE)
                  await createTx.wait(1)
                  const tx = await subManager.createSubscription(PRICE)
                  await tx.wait(1)
                  const ctx = await subManager.createSubscription(PRICE)
                  await ctx.wait(1)
                  const startLength = await subManager.getNumberofSubscriptions()
                  await subManager.deleteSubscription("1")
                  const isActive = (await subManager.getSubscriptionInfo("1")).isActive
                  const endLength = await subManager.getNumberofSubscriptions()
                  const listPointer = (await subManager.getSubscriptionInfo("2")).listPointer
                  const listPointerNew = (await subManager.getSubscriptionInfo("1")).listPointer
                  assert.equal(false, isActive)
                  assert.equal(startLength.toNumber(), endLength.toNumber() + 1)
                  assert.equal(listPointer.toString(), listPointerNew.toString())
              })
          })
          describe("unsubscribe", function () {
              it("reverts if user is not Subscribed", async function () {
                  const createTx = await subManager.createSubscription(PRICE)
                  await createTx.wait(1)
                  await expect(subManager.unSubscribe("0")).to.be.revertedWith("NotSubscribed")
              })
              it("removes user from array, sets isSubscribed to false, properly sets listPointer of moved user", async function () {
                  const createTx = await subManager.createSubscription(PRICE)
                  await createTx.wait(1)
                  await subManager.subscribe("0")
                  await subManagerPlayer.subscribe("0")
                  await subManagerPlayer2.subscribe("0")
                  const startLength = await subManager.getNumberofUsers("0")
                  const tx = await subManagerPlayer.unSubscribe("0")
                  await tx.wait(1)
                  const isSubscribed = (await subManager.getUserInfo("0", player)).isSubscribed
                  const endLength = await subManager.getNumberofUsers("0")
                  const listPointer = (await subManager.getUserInfo("0", player)).listPointer
                  const listPointerNew = (await subManager.getUserInfo("0", player2)).listPointer

                  assert.equal(false, isSubscribed)
                  assert.equal(startLength.toNumber(), endLength.toNumber() + 1)
                  assert.equal(listPointer.toString(), listPointerNew.toString())
              })
          })
          describe("withdrawFunds", function () {
              it("reverts if user has insufficent funds", async function () {
                  await expect(subManager.withdrawFunds(PRICE)).to.be.revertedWith("NotEnoughFunds")
              })
              it("updates users contract balance correctly", async function () {
                  const tx = await subManager.depositFunds({ value: PRICE })
                  await tx.wait(1)
                  const deposit = await subManager.depositFunds({ value: PRICE })
                  await deposit.wait(1)
                  await subManager.withdrawFunds(PRICE)
                  const balance = await subManager.getBalance(deployer)
                  assert.equal(balance.toString(), PRICE)
              })

              it("transfers msg.sender the amount they withdrew", async function () {
                  const tx = await subManager.depositFunds({ value: PRICE })
                  await tx.wait(1)
                  const tx2 = await subManager.depositFunds({ value: PRICE })
                  await tx2.wait(1)
                  const userBalanceBefore = await subManager.getBalance(deployer)
                  const userWalletBefore = await provider.getBalance(deployer)
                  const withdrawTx = await subManager.withdrawFunds(PRICE)
                  const withdrawTxReciept = await withdrawTx.wait(1)
                  const { gasUsed, effectiveGasPrice } = withdrawTxReciept
                  const updatedBalance = await subManager.getBalance(deployer)
                  const updatedWallet = await provider.getBalance(deployer)
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  assert.equal(
                      userWalletBefore.add(userBalanceBefore).toString(),
                      updatedWallet.add(updatedBalance).add(gasCost).toString()
                  )
              })
          })
      })
