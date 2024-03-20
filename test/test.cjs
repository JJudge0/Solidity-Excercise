// SPDX-License-Identifier: UNLICENSED
// const { expect } = require("chai");
import('chai').then(chai => {
  }).catch(err => {
  });
  
// import { ethers } from 'hardhat';

const hardhat = require('hardhat');
const ethers = hardhat.ethers;

describe("StakingContract", function () {
  let StakingContract;
  let stakingContract;
  let owner;
  let userA;

  const REWARD_PER_DAY_PER_1000_DEFI = ethers.utils.parseEther("1");
  const BLOCKS_PER_DAY = 86400 / 6; // Ethereum block time is 6 seconds and '86400' is total amount of seconds in a day   

  beforeEach(async function () {
    [owner, userA] = await ethers.getSigners();

    // Deploy StakingContract
    StakingContract = await ethers.getContractFactory("StakingContract");
    stakingContract = await StakingContract.deploy(owner.address);

    // Approve tokens to the staking contract
    // Ensure that stakingToken is an instance of ERC20 token contract
    // For example, you can check if it has the 'approve' function
    const stakingToken = await ethers.getContractAt("IERC20", await stakingContract.stakingToken());
    if (typeof stakingToken.approve !== 'function') {
      throw new Error("stakingToken does not support 'approve' function");
    }

    // Now you can safely call the approve function
    await stakingToken.connect(userA).approve(stakingContract.address, ethers.constants.MaxUint256);
  });

  it("should allow user to stake tokens", async function () {
    const amount = ethers.utils.parseEther("1000");
    await stakingContract.connect(userA).stake(amount);

    const stakedBalance = await stakingContract.stakedBalance(userA.address);
    expect(stakedBalance).to.equal(amount, "Incorrect staked balance");

    const lastStakedTime = await stakingContract.lastStakedTime(userA.address);
    expect(lastStakedTime).to.be.closeTo(await ethers.provider.getBlock("latest").timestamp, 60, "Incorrect last staked time");
  });

  it("should calculate rewards correctly", async function () {
    const amount = ethers.utils.parseEther("1000");
    await stakingContract.connect(userA).stake(amount);

    // Fast-forward 10 days
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const rewards = await stakingContract.calculateRewards(userA.address);
    const expectedRewards = amount.mul(BLOCKS_PER_DAY * 10).div(1000);
    expect(rewards).to.equal(expectedRewards, "Incorrect rewards calculated");
  });

  it("should allow user to withdraw stakes and rewards", async function () {
    const amount = ethers.utils.parseEther("1000");
    await stakingContract.connect(userA).stake(amount);

    // Fast-forward 10 days
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const initialBalance = await ethers.provider.getBalance(userA.address);
    await stakingContract.connect(userA).withdraw();

    const finalBalance = await ethers.provider.getBalance(userA.address);
    const rewards = finalBalance.sub(initialBalance);

    const expectedRewards = amount.mul(BLOCKS_PER_DAY * 10).div(1000);
    expect(rewards).to.equal(expectedRewards.add(amount), "Incorrect rewards and staked amount withdrawn");

    
  });
});
