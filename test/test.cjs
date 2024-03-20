// SPDX-License-Identifier: UNLICENSED
// const { expect } = require("chai");
import('chai').then(chai => {
  }).catch(err => {
  });
  
// import { ethers } from 'hardhat';

const hardhat = require('hardhat');
const ethers = hardhat.ethers;


describe("Staking SmartContract", function () {
  let StakingExcercise;
  let stakingContract;
  let owner;
  let userA;
  let stakingToken;

  beforeEach(async function () {
    [owner, userA] = await ethers.getSigners();

    // Deploy StakingExcercise
    StakingExcercise = await ethers.getContractFactory("StakingContract");
    stakingContract = await StakingExcercise.deploy(stakingToken.address);

    // Approve tokens to the staking contract
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
    const expectedRewards = amount.mul(10).div(1000); // 1 DEFI per day per 1000 DEFI staked
    expect(rewards).to.equal(expectedRewards, "Incorrect rewards calculated");
  });

  it("should allow user to withdraw stakes and rewards", async function () {
    const amount = ethers.utils.parseEther("1000");
    await stakingContract.connect(userA).stake(amount);

    // Fast-forward 10 days
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    await stakingContract.connect(userA).withdraw();

    const stakedBalance = await stakingContract.stakedBalance(userA.address);
    expect(stakedBalance).to.equal(0, "Staked balance not reset after withdrawal");

    const lastStakedTime = await stakingContract.lastStakedTime(userA.address);
    expect(lastStakedTime).to.equal(0, "Last staked time not reset after withdrawal");
  });

  it("should return correct rewards with viewRewards", async function () {
    const amount = ethers.utils.parseEther("1000");
    await stakingContract.connect(userA).stake(amount);

    // Fast-forward 10 days
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const rewards = await stakingContract.viewRewards(userA.address);
    const expectedRewards = amount.mul(10).div(1000); // 1 DEFI per day per 1000 DEFI staked
    expect(rewards).to.equal(expectedRewards, "Incorrect rewards returned by viewRewards");
  });
});
