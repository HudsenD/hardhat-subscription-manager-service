# Subscription Manager Service

NOTE: this project is not in a "finished" state, nor should it be used/interpreted as such. I decided to move on to some other projects for now but
I may refine this at a later date.

This is a practice project that I made with one goal in mind: Make an automatic subscription payment
service. This smart contract automatically manages subscription payments for companies and thier users, and
automatically removes users from the subscription if they have an insufficent balance deposited in the contract.
A company can create a subscription using the createSubscription() function, and then its users will subscribe to that subscription by calling subscribe() with the subscriptionId as an input.
Then Chainlink keepers would call the autoSubscriptionPayment() function at a specified interval.

## Lessons Learned

While this project has its flaws, I still managed to learn a lot while making it.
Including how to properly implement a storage pattern in solidity for the desired use case, practice with some increased code complexity,
and starting a project from nothing but an idea in my head.
Although I accomplished my original goal of automating payments, I did so in a way that is not very gas friendly
and resulted in some issues during my personal testing of the contract functionality. To combat the problem of autoSubscriptionPayment()
having the potential to use infinite gas, I added Limits to the amount of subscriptons that can be made, and the amount of users that can use
a single subscripton. These values are intialized in the constructor. I wouldn't consider this a fix, since a contract should be able to scale
with its users and not sacrifice functionality, however I did not want to completely scrap everything I built.

## 🛠 Skills

Solidity, Hardhat, Javascript, Ethers.js
