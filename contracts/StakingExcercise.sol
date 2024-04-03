
// SPDX-License-Identifier: UNLICENSED

// Uncomment this line to use console.log
// import "hardhat/console.sol";

//To note:
// The  rewards are calculated  only when the user interacts with the contract (i.e., when staking or withdrawing), because emitting to every block will cause a huge gas cost it's all about efficieny. 

pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);  // Allows tokens from sender 
    function transfer(address recipient, uint256 amount) external returns (bool); // Allows and specifies tokens from recipient  
    function balanceOf(address account) external view returns (uint256); // The address balance
}

contract StakingContract {
   
    address public stakingToken;

    // Mapping of user addresses to their staked balances and last staked time
    mapping(address => uint256) public stakedBalance;  //Gets the wallet addresses to staked balance
    mapping(address => uint256) public lastStakedTime; // Gets the staking time

  
    uint256 public constant rewardsperday = 1 ether; // 1 DEFI per day per 1000 DEFI staked as queston specified
    uint256 public constant blocksperday = 86400 / 6; // 6 seconds per block as queston specified '86400' is total amount of seconds in a day   

    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);


    constructor(address _stakingToken) {
        stakingToken = _stakingToken;
    }

    // Stake tokens function allows user to stake multiple times and the current staking balance will be updated when the user stakes again.
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(IERC20(stakingToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Calculate and transfer rewards
        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > 0) {
            require(IERC20(stakingToken).transfer(msg.sender, rewards), "Reward transfer failed");
            emit RewardsClaimed(msg.sender, rewards);
        }

        // Update staked balance and last staked time
        stakedBalance[msg.sender] += amount;
        lastStakedTime[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    // Withdraw stakes and rewards
    function withdraw() external {
        uint256 amount = stakedBalance[msg.sender];
        require(amount > 0, "No staked tokens");

        // Calculate and transfer rewards
        uint256 rewards = calculateRewards(msg.sender);
        uint256 totalAmount = amount + rewards;

        // Reset staked balance and last staked time
        stakedBalance[msg.sender] = 0;
        lastStakedTime[msg.sender] = 0;

        // Transfer staked tokens and rewards
        require(IERC20(stakingToken).transfer(msg.sender, totalAmount), "Transfer failed");

        emit Withdrawn(msg.sender, totalAmount);
    }

    // View available rewards
    function viewRewards(address user) external view returns (uint256) {
        return calculateRewards(user);
    }

    // Internal function to calculate rewards
    function calculateRewards(address user) internal view returns (uint256) {
        uint256 elapsedTime = block.timestamp - lastStakedTime[user];
        uint256 stakedAmount = stakedBalance[user];

        // Calculate rewards based on staked amount and time elapsed
        uint256 rewards = (stakedAmount * elapsedTime * rewardsperday) / (1000 * blocksperday); 
        return rewards;
    }
}
