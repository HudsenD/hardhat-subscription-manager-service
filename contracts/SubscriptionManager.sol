// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error SubscriptionManager__InactiveSubscription();
error SubscriptionManager__NotSubscriptionOwner();
error SubscriptionManager__AlreadySubscribed();
error SubscriptionManager__NotSubscribed();
error SubscriptionManager__NoValue();
error SubscriptionManager__NotEnoughFunds();
error SubscriptionManager__TransferFailed();
error SubscriptionManager__TooManyActiveSubscriptions();
error SubscriptionManager__TooManyActiveUsers();
error SubscriptionManager__NotKeeper();

contract SubscriptionManager is ReentrancyGuard {
    uint256 private subIdCounter;
    uint256 private immutable i_activeSubscriptionLimit;
    uint256 private immutable i_activeUserLimit;
    address private immutable i_chainlinkKeeperContract;

    struct SubscriptionInfo {
        bool isActive;
        uint256 listPointer;
        uint256 subscriptionPrice;
        address subscriptionOwner;
        address[] activeUsers;
    }

    struct UserInfo {
        bool isSubscribed;
        uint256 listPointer;
    }

    event UserSubscribed(uint256 indexed subId, address indexed user);
    event UserUnsubscribed(uint256 indexed subId, address indexed user);

    //subscriptionId -> subscriptionInfo
    mapping(uint256 => SubscriptionInfo) private s_subIdToInfo;
    uint256[] private subscriptionIdList;

    // subId -> user -> UserInfo
    mapping(uint256 => mapping(address => UserInfo)) s_subIdToUserInfo;

    mapping(address => uint256) private s_balances;

    modifier isActiveSubscription(uint256 subId) {
        if (s_subIdToInfo[subId].isActive == false) {
            revert SubscriptionManager__InactiveSubscription();
        }
        _;
    }

    constructor(
        address chainlinkKeeperContract,
        uint256 activeSubscriptionLimit,
        uint256 activeUserLimit
    ) {
        i_chainlinkKeeperContract = chainlinkKeeperContract;
        i_activeSubscriptionLimit = activeSubscriptionLimit;
        i_activeUserLimit = activeUserLimit;
    }

    // could make this payable or prefferably part of a subscription that is initalized with constructor.
    // we can call this function in constructor, and then anyone who "creates a subscription" will call subscribe() with input value of the first sub made(0).
    // then deleteSubscription would call unsubscribe
    function createSubscription(uint256 price) public returns (uint256) {
        if (subscriptionIdList.length >= i_activeSubscriptionLimit) {
            revert SubscriptionManager__TooManyActiveSubscriptions();
        }
        uint256 subId = subIdCounter;
        subIdCounter = subIdCounter + 1;
        SubscriptionInfo memory newSubscription;
        newSubscription.isActive = true;
        newSubscription.listPointer = subscriptionIdList.length;
        newSubscription.subscriptionPrice = price;
        newSubscription.subscriptionOwner = msg.sender;
        s_subIdToInfo[subId] = newSubscription;
        subscriptionIdList.push(subId);
        return subId;
    }

    function deleteSubscription(uint256 subId) public {
        if (s_subIdToInfo[subId].subscriptionOwner != msg.sender) {
            revert SubscriptionManager__NotSubscriptionOwner();
        }
        s_subIdToInfo[subId].isActive = false;
        uint256 subToDelete = s_subIdToInfo[subId].listPointer;
        uint256 subToMove = subscriptionIdList[subscriptionIdList.length - 1];
        subscriptionIdList[subToDelete] = subToMove;
        s_subIdToInfo[subToMove].listPointer = subToDelete;
        subscriptionIdList.pop();
    }

    function subscribe(uint256 subId) public isActiveSubscription(subId) {
        if (s_subIdToInfo[subId].activeUsers.length >= i_activeUserLimit) {
            revert SubscriptionManager__TooManyActiveUsers();
        }
        if (s_subIdToUserInfo[subId][msg.sender].isSubscribed == true) {
            revert SubscriptionManager__AlreadySubscribed();
        }
        s_subIdToUserInfo[subId][msg.sender] = UserInfo(true, s_subIdToInfo[subId].activeUsers.length);
        s_subIdToInfo[subId].activeUsers.push(msg.sender);
    }

    function unSubscribe(uint256 subId) public {
        if (s_subIdToUserInfo[subId][msg.sender].isSubscribed == false) {
            revert SubscriptionManager__NotSubscribed();
        }
        _unSubscribe(subId, msg.sender);
        emit UserSubscribed(subId, msg.sender);
    }

    function _unSubscribe(uint256 subId, address user) internal {
        s_subIdToUserInfo[subId][user].isSubscribed = false;
        uint256 userToDelete = s_subIdToUserInfo[subId][user].listPointer;
        address userToMove = s_subIdToInfo[subId].activeUsers[s_subIdToInfo[subId].activeUsers.length - 1];
        s_subIdToInfo[subId].activeUsers[userToDelete] = userToMove;
        s_subIdToUserInfo[subId][userToMove].listPointer = userToDelete;
        s_subIdToInfo[subId].activeUsers.pop();
        emit UserUnsubscribed(subId, user);
    }

    // I intend for this function to be called by chainlink keepers on 1st of every month
    function autoSubscriptionPayment() external nonReentrant {
        if (msg.sender != i_chainlinkKeeperContract) {
            revert SubscriptionManager__NotKeeper();
        }
        for (uint256 i = 0; i < subscriptionIdList.length && i < i_activeSubscriptionLimit; i++) {
            uint256 subId = subscriptionIdList[i];
            SubscriptionInfo memory subscriptionInfo = s_subIdToInfo[subId];
            uint256 priceToPay = subscriptionInfo.subscriptionPrice;
            address subscriptionOwner = subscriptionInfo.subscriptionOwner;

            for (uint256 a = 0; a < subscriptionInfo.activeUsers.length && a < i_activeUserLimit; a++) {
                address user = subscriptionInfo.activeUsers[a];
                uint256 userBalance = s_balances[user];

                if (userBalance >= priceToPay) {
                    s_balances[user] -= priceToPay;
                    s_balances[subscriptionOwner] += priceToPay;
                } else {
                    _unSubscribe(subId, user);
                }
            }
        }
    }

    function depositFunds() public payable {
        if (msg.value <= 0) {
            revert SubscriptionManager__NoValue();
        }
        s_balances[msg.sender] += msg.value;
    }

    function withdrawFunds(uint256 withdrawAmount) public nonReentrant {
        if (withdrawAmount > s_balances[msg.sender]) {
            revert SubscriptionManager__NotEnoughFunds();
        }
        s_balances[msg.sender] -= withdrawAmount;
        (bool success, ) = payable(msg.sender).call{value: withdrawAmount}("");
        if (!success) {
            revert SubscriptionManager__TransferFailed();
        }
    }

    function getBalance(address user) external view returns (uint256) {
        return s_balances[user];
    }

    function getSubscriptionInfo(uint256 subId) external view returns (SubscriptionInfo memory) {
        return s_subIdToInfo[subId];
    }

    function getNumberofSubscriptions() external view returns (uint256) {
        return subscriptionIdList.length;
    }

    function getNumberofUsers(uint256 subId) external view returns (uint256) {
        return s_subIdToInfo[subId].activeUsers.length;
    }

    function getUserInfo(uint256 subId, address user) external view returns (UserInfo memory) {
        return s_subIdToUserInfo[subId][user];
    }
}
