// Read-only chain access for verifying off-site payments. The app never
// holds a private key, never signs, and never sends a transaction — it only
// reads public chain data over a free RPC endpoint to confirm a payment
// landed at RECEIVING_ADDRESS.

import { createPublicClient, formatEther, http, type Hash } from "viem";

const RPC_URL = process.env.RPC_URL ?? "https://sepolia.base.org";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 84532);
export const RECEIVING_ADDRESS = (
  process.env.RECEIVING_ADDRESS ?? "0xYourReceivingAddressHere"
).toLowerCase();
export const MIN_CONFIRMATIONS = Number(process.env.MIN_CONFIRMATIONS ?? 2);

// Keep well under Vercel Hobby's ~10s function timeout — each verification
// makes at most 3 sequential read calls.
const RPC_TIMEOUT_MS = 6000;

export const publicClient = createPublicClient({
  transport: http(RPC_URL, { timeout: RPC_TIMEOUT_MS }),
});

export type VerifyFailureReason =
  | "not_found"
  | "pending"
  | "failed"
  | "wrong_recipient"
  | "underpaid"
  | "unconfirmed"
  | "rpc_error";

export type VerifyResult =
  | { ok: true; from: string; amountWei: string; chainId: number }
  | { ok: false; reason: VerifyFailureReason };

/** Verifies a payment using only read-only RPC calls. */
export async function verifyPayment(
  txHash: Hash,
  minAmountWei: bigint
): Promise<VerifyResult> {
  try {
    const tx = await publicClient.getTransaction({ hash: txHash });
    if (!tx) return { ok: false, reason: "not_found" };
    if (tx.to?.toLowerCase() !== RECEIVING_ADDRESS) {
      return { ok: false, reason: "wrong_recipient" };
    }

    const receipt = await publicClient
      .getTransactionReceipt({ hash: txHash })
      .catch(() => null);
    if (!receipt) return { ok: false, reason: "pending" };
    if (receipt.status !== "success") return { ok: false, reason: "failed" };

    const latest = await publicClient.getBlockNumber();
    const confirmations = latest - receipt.blockNumber;
    if (confirmations < BigInt(MIN_CONFIRMATIONS)) {
      return { ok: false, reason: "unconfirmed" };
    }

    if (tx.value < minAmountWei) return { ok: false, reason: "underpaid" };

    return {
      ok: true,
      from: tx.from.toLowerCase(),
      amountWei: tx.value.toString(),
      chainId: CHAIN_ID,
    };
  } catch {
    return { ok: false, reason: "rpc_error" };
  }
}

export function formatEth(weiString: string | null | undefined): string {
  if (!weiString) return "0";
  try {
    return formatEther(BigInt(weiString));
  } catch {
    return "0";
  }
}

export const VERIFY_ERROR_MESSAGES: Record<VerifyFailureReason, string> = {
  not_found:
    "Transaction not found on this network yet. If you just sent it, wait a few seconds and try again.",
  pending: "Transaction is still pending. Wait for it to be mined and try again.",
  unconfirmed: "Transaction is mined but waiting for more confirmations. Try again shortly.",
  failed: "That transaction failed on-chain — it did not transfer funds.",
  wrong_recipient: "That transaction wasn't sent to this site's receiving address.",
  underpaid: "That transaction's amount is less than the required price.",
  rpc_error: "Couldn't reach the chain right now. Please try again in a moment.",
};
