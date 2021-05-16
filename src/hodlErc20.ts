import { BigInt } from "@graphprotocol/graph-ts"
import {
  Deposit,
  Exit,
  Redeem,
  Withdraw
} from "../generated/templates/HodlERC20/HodlERC20"
import { HToken } from "../generated/schema"
import { getOrCreateAccountHodling } from './utils'

export function handleDeposit(event: Deposit): void {
  let accountHodling = getOrCreateAccountHodling(event.params.depositor, event.address.toHex())
  accountHodling.balance = accountHodling.balance.plus(event.params.amount)
  accountHodling.shareBalance = accountHodling.shareBalance.plus(event.params.shares)
  accountHodling.save()

  //
  let hToken = HToken.load(event.address.toHex())
  hToken.tokenBalance = hToken.tokenBalance.plus(event.params.amount)
}

export function handleExit(event: Exit): void {
  // only handle "balance" in an AccountHodling entity. Shares will be managed by _redeem
  let fee = event.params.fee
  let reward = event.params.reward
  let totalAmountBurned = event.params.amountOut.plus(fee).plus(reward)
  let accountHodling = getOrCreateAccountHodling(event.params.quitter, event.address.toHex())
  
  accountHodling.balance = accountHodling.balance.minus(totalAmountBurned)
  accountHodling.save()

  let hToken = HToken.load(event.address.toHex())
  
  hToken.tokenBalance = hToken.tokenBalance.minus(totalAmountBurned)
  hToken.totalFee = hToken.totalFee.plus(fee)
  hToken.totalReward = hToken.totalReward.plus(reward)

  hToken.save()
}

export function handleRedeem(event: Redeem): void {
  // reduce shares + payout reward
  let accountHodling = getOrCreateAccountHodling(event.params.recipient, event.address.toHex())

  let shareBurned = event.params.shareBurned
  accountHodling.shareBalance = accountHodling.shareBalance.minus(shareBurned)
  accountHodling.save()

  let hToken = HToken.load(event.address.toHex())
  let payout = event.params.reward
  
  hToken.tokenBalance = hToken.tokenBalance.minus(payout)
  hToken.totalShares = hToken.totalShares.minus(shareBurned)
  hToken.save()
}

export function handleWithdraw(event: Withdraw): void {
  // withdraw capital
  let accountHodling = getOrCreateAccountHodling(event.params.recipient, event.address.toHex())
  let amount = event.params.amountOut
  accountHodling.balance = accountHodling.balance.minus(amount)

  let hToken = HToken.load(event.address.toHex())
  hToken.tokenBalance = hToken.tokenBalance.minus(amount)
  hToken.save()

}
