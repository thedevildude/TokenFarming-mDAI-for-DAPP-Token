const { assert } = require("chai")

const DaiToken = artifacts.require("DaiToken")
const DappToken = artifacts.require("DappToken")
const TokenFarm = artifacts.require("TokenFarm")

require("Chai")
    .use(require("chai-as-promised"))
    .should()

function tokens(n) {
    return web3.utils.toWei(n, "Ether")
}
contract("TokenFarm", ([owner, investor]) => {
    
    let daiToken, dappToken, tokenFarm

    before(async () => {

        // Load Contracts
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        // Transfer all Dapp tokens to Token Farm

        await dappToken.transfer(tokenFarm.address, tokens("1000000"))

        // Send tokens to investors

        await daiToken.transfer(investor, tokens("100"), { from: owner })
    })

    describe("Mock DAI Deployment", async () => {
        it("has a name", async () => {
            const name = await daiToken.name()
            assert.equal(name, "Mock DAI Token")
        })
    })

    describe("Dapp Token Deployment", async () => {
        it("has a name", async () => {
            const name = await dappToken.name()
            assert.equal(name, "DApp Token")
        })
    })

    describe("Token Farm Deployment", async () => {
        it("has a name", async () => {
            const name = await tokenFarm.name()
            assert.equal(name, "Dapp Token Farm")
        })
        it("contract has tokens", async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens("1000000"))
        })
    })

    describe("Farming Tokens", async () => {
        it("rewards investors for staking mDai Tokens", async () => {
            let result

            // Check Investor Balance before Staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens("100"), "Investor Mock DAI Wallet balance correct before staking")

            // Stack Mock DAI tokens
            await daiToken.approve(tokenFarm.address, tokens("100"), { from: investor })
            await tokenFarm.stakeTokens(tokens("100"), { from: investor })

            // Check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens("0"), "investor Mock DAI Wallet Balance correct after staking")

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens("100"), "Tokens Farm Mock DAI Balance correct after staking")

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens("100"), "Investor Staking Balance correct after staking")

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), "true", "Investor Staking Status correct after staking")

            // Issue Tokens

            await tokenFarm.issueTokens({ from: owner })

            // Check Balance after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens("100"), "investor DApp Token Wallet balance correct after issuance")

            // Ensure that only owners can issue tokens
            await tokenFarm.issueTokens({ from: investor}).should.be.rejected
            // 100000000000000000000

            // Unstake Tokens
            await tokenFarm.unstakeTokens({ from: investor})

            // Check results after staking
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens("100"), "Investor Mock DAI Wallet Balance correct after unstaking")

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens("0"), "Token Farm Mock DAI Balance correct after unstaking")

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens("0"), "Investor staking balance correct after unstaking")

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), "false", "Investor staking status correct after staking")

        })
    })
})