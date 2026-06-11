import { blockchainService } from './blockchainService.js';
import { BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PublicKey, Connection } from '@solana/web3.js';
import { config } from '../config/index.js';

// Helper function to convert escrow state string to numeric value
const escrowStateToNumber = (state: string | number): number => {
  if (typeof state === 'number') return state;

  switch (state) {
    case 'CREATED':
      return 0;
    case 'FUNDED':
      return 1;
    case 'RELEASED':
      return 2;
    case 'CANCELLED':
      return 3;
    case 'DISPUTED':
      return 4;
    case 'RESOLVED':
      return 5;
    default:
      return 0;
  }
};

/**
 * Helper function to derive the associated token account for a wallet and token mint
 * @param walletAddress The wallet's public key address
 * @param token Token symbol ('USDT' or 'USDC'). Defaults to 'USDT'.
 * @returns The associated token account address as a string
 */
const deriveTokenAccount = async (walletAddress: string, token: string = 'USDT'): Promise<string> => {
  const walletPublicKey = new PublicKey(walletAddress);

  const currentNetwork = blockchainService.getCurrentNetwork();

  const mintAddress = token === 'USDT'
    ? (currentNetwork.usdtMint || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')
    : (currentNetwork.usdcMint || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  const mint = new PublicKey(mintAddress);

  const tokenAccount = await getAssociatedTokenAddress(mint, walletPublicKey);

  return tokenAccount.toString();
};

/**
 * Determines whether the relay should pay gas for this transaction.
 * Checks user's SOL balance — if they have enough to cover the tx fee they pay,
 * otherwise the relay (gas payer) covers it.
 */
const shouldUseRelay = async (wallet: any): Promise<boolean> => {
  if (!config.gasPayerPubkey) return false;

  try {
    const network = blockchainService.getCurrentNetwork();
    const connection = new Connection(network.rpcUrl, 'confirmed');
    const balance = await connection.getBalance(new PublicKey(wallet.address));
    
    // Estimated cost of a Solana transaction with priority fee (~10k lamports)
    const estimatedTxCost = 10_000; // 0.00001 SOL
    return balance < estimatedTxCost;
  } catch {
    return true; // If we can't check balance, fall back to relay
  }
};

/**
 * Creates an escrow transaction on the Solana blockchain
 * @param wallet The Dynamic.xyz wallet object
 * @param params Parameters for creating the escrow
 * @returns The transaction result with escrow ID, transaction hash, and block number
 */
export const createEscrowTransaction = async (
  wallet: any,
  params: {
    tradeId: number;
    escrowId: number; // Accept pre-generated escrow ID
    buyer: string;
    amount: number;
    sequential?: boolean;
    sequentialEscrowAddress?: string;
    arbitrator?: string; // Optional parameter for arbitrator address
  }
) => {
  try {
    // Convert amount to BN (assuming 6 decimals for USDC)
    const amountBN = new BN(params.amount * 1_000_000); // Convert to smallest unit

    // Create escrow using UnifiedBlockchainService
    const result = await blockchainService.createEscrow({
      escrowId: params.escrowId, // Use the pre-generated escrow ID
      tradeId: params.tradeId,
      sellerAddress: wallet.address,
      buyerAddress: params.buyer,
      amount: amountBN,
      arbitratorAddress: params.arbitrator || '', // Use provided arbitrator or empty
      depositDeadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
      fiatDeadline: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days from now
      sequential: params.sequential || false,
      sequentialEscrowAddress: params.sequentialEscrowAddress,
      useRelay: await shouldUseRelay(wallet),
    });


    return {
      escrowId: params.escrowId.toString(), // Return the same escrow ID that was passed in
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
      // Include the full result for debugging
      fullResult: result,
    };
  } catch (error) {
    console.error('[ERROR] Failed to create Solana escrow:', error);
    throw error;
  }
};

/**
 * Checks the token allowance granted by an owner to a spender.
 * Note: This is not applicable to Solana as it uses a different token model.
 * @param wallet The Dynamic.xyz wallet object
 * @param tokenAddress The address of the token mint
 * @param spenderAddress The address of the spender (not used in Solana)
 * @param ownerAddress The address of the token owner (optional, defaults to wallet address)
 * @returns The allowance amount as a BigInt (always returns max for Solana)
 */
export const getTokenAllowance = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _wallet: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tokenAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _spenderAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ownerAddress?: string
): Promise<bigint> => {
  // In Solana, token accounts don't have allowances like ERC20
  // The owner has full control over their token accounts
  return BigInt('18446744073709551615'); // Max uint64
};

/**
 * Approves a spender to spend a certain amount of the owner's tokens.
 * Note: This is not applicable to Solana as it uses a different token model.
 * @param wallet The Dynamic.xyz wallet object
 * @param tokenAddress The address of the token mint
 * @param spenderAddress The address of the spender (not used in Solana)
 * @param amount The amount to approve (not used in Solana)
 * @returns The transaction hash (returns empty string for Solana)
 */
export const approveTokenSpending = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _wallet: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tokenAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _spenderAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _amount: bigint
): Promise<string> => {
  // In Solana, no approval is needed - the owner has full control
  return ''; // Return empty string to indicate no transaction needed
};

/**
 * Funds an existing escrow on the Solana blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to fund (as a string or number)
 * @returns The transaction result with txHash and blockNumber.
 */
export const fundEscrowTransaction = async (
  wallet: any,
  escrowId: string | number,
  tradeData?: { id: number; leg1_crypto_amount: number }
): Promise<{ txHash: string; blockNumber: bigint }> => {
  try {

    // Use trade data if available, otherwise fall back to defaults
    const tradeId = tradeData?.id || 0;
    const amount = tradeData?.leg1_crypto_amount
      ? (tradeData.leg1_crypto_amount * 1000000).toString() // Convert to USDC units (6 decimals)
      : '1000000'; // Default 1 USDC

    const sellerTokenAccount = await deriveTokenAccount(wallet.address, 'USDT');

    const result = await blockchainService.fundEscrow({
      escrowId: Number(escrowId),
      tradeId: tradeId,
      amount: amount,
      sellerAddress: wallet.address,
      sellerTokenAccount: sellerTokenAccount,
      useRelay: await shouldUseRelay(wallet),
    });


    return {
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
    };
  } catch (error) {
    console.error(`[ERROR] Failed to fund Solana escrow ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Helper function to check if an escrow needs funding and fund it if necessary.
 * This handles the token approval and funding in one function.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to fund
 * @param amount The amount to fund (in the smallest unit, e.g., wei)
 * @returns The transaction hash of the funding transaction.
 */
export const checkAndFundEscrow = async (
  wallet: any,
  escrowId: string | number,
  tradeData?: { id: number; leg1_crypto_amount: string | number }
): Promise<string> => {
  try {

    // In Solana, we don't need to check allowance, just fund directly
    const result = await fundEscrowTransaction(wallet, escrowId, tradeData);
    return result.txHash;
  } catch (error) {
    console.error(`[ERROR] Failed to check and fund Solana escrow ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Marks the fiat payment as paid for an escrow on the Solana blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowAddress The address of the escrow to mark as paid
 * @returns The transaction hash.
 */
export const markFiatPaidTransaction = async (
  wallet: any,
  escrowAddress: string
): Promise<string> => {
  try {

    const escrowState = await blockchainService.getEscrowStateByAddress(escrowAddress);

    const markFiatPaidParams = {
      escrowId: escrowState.id,
      tradeId: escrowState.tradeId,
      buyerAddress: wallet.address,
      useRelay: await shouldUseRelay(wallet),
    };

    const result = await blockchainService.markFiatPaid(markFiatPaidParams);


    return result.transactionHash || result.signature || '';
  } catch (error) {
    console.error(`[ERROR] Failed to mark fiat as paid for Solana escrow ${escrowAddress}:`, error);
    throw error;
  }
};

/**
 * Releases an escrow on the Solana blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowAddress The address of the escrow to release
 * @returns The transaction hash and block number
 */
export const releaseEscrowTransaction = async (
  wallet: any,
  escrowAddress: string
): Promise<{ txHash: string; blockNumber: bigint }> => {
  try {

    // Get the escrow details to extract escrowId and tradeId
    const escrowState = await blockchainService.getEscrowStateByAddress(escrowAddress);


    // Get USDC mint from network config
    const { getSolanaDevnetConfig } = await import('../config');
    const solanaConfig = getSolanaDevnetConfig();
    const usdcMint = new PublicKey(solanaConfig.usdcMint);


    // Derive token accounts for buyer and arbitrator
    const buyerTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      new PublicKey(escrowState.buyerAddress)
    );

    const arbitratorTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      new PublicKey(escrowState.arbitratorAddress)
    );


    // Note: Token accounts will be validated by the Solana program constraints

    // Validate escrow state before attempting release
    if (escrowState.state !== 'FUNDED') {
      throw new Error(`Escrow is not in FUNDED state. Current state: ${escrowState.state}`);
    }

    if (!escrowState.fiatPaid) {
      throw new Error('Fiat payment has not been marked as paid yet');
    }

    // Validate authority
    const isSeller = wallet.address === escrowState.sellerAddress;
    const isArbitrator = wallet.address === escrowState.arbitratorAddress;

    if (!isSeller && !isArbitrator) {
      throw new Error(
        `Wallet ${wallet.address} is not authorized to release escrow. Must be seller (${escrowState.sellerAddress}) or arbitrator (${escrowState.arbitratorAddress})`
      );
    }

    const releaseEscrowParams = {
      escrowId: escrowState.id,
      tradeId: escrowState.tradeId,
      authorityAddress: wallet.address,
      buyerAddress: escrowState.buyerAddress,
      arbitratorAddress: escrowState.arbitratorAddress,
      sequentialEscrowTokenAccount: undefined,
      useRelay: await shouldUseRelay(wallet),
    };

    const result = await blockchainService.releaseEscrow(releaseEscrowParams);


    return {
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
    };
  } catch (error) {
    console.error(`[ERROR] Failed to release Solana escrow ${escrowAddress}:`, error);
    throw error;
  }
};

/**
 * Opens a dispute for an escrow on the Solana blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to dispute
 * @param evidenceHash The hash of the evidence for the dispute (bytes32)
 * @returns The transaction hash and block number
 */
export const disputeEscrowTransaction = async (
  wallet: any,
  escrowId: string | number,
  evidenceHash: string
): Promise<{ txHash: string; blockNumber: bigint }> => {
  try {

    const result = await blockchainService.openDispute({
      escrowId: Number(escrowId),
      tradeId: 0, // We'll need to get this from the escrow data
      evidenceHash: evidenceHash,
      bondAmount: '1000000', // Default bond amount
      disputingPartyAddress: wallet.address,
      disputingPartyTokenAccount: '', // We'll need to derive this
    });


    return {
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
    };
  } catch (error) {
    console.error(`[ERROR] Failed to dispute Solana escrow ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Fetches the USDC balance for a given wallet address using Solana.
 * @param address Wallet address (string)
 * @param chainId Network chain ID (optional, defaults to devnet)
 * @returns Promise<BigInt> USDC balance (in smallest unit, e.g. 6 decimals)
 */
export async function getUsdcBalance(
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _chainId?: number
): Promise<bigint> {
  try {

    // Use the blockchain service to get balance
    const balance = await blockchainService.getWalletBalance();

    return BigInt(balance);
  } catch (error) {
    console.error('[ERROR] Failed to get Solana USDC balance:', error);
    throw error;
  }
}

/**
 * Checks the state and funds of an escrow on Solana.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowAddress The address of the escrow to check
 * @returns Object containing state and amount information
 */
export const checkEscrowState = async (
  _wallet: any,
  escrowAddress: string
): Promise<{ state: number; amount: bigint; hasFunds: boolean; fiatPaid: boolean }> => {
  try {

    const escrowState = await blockchainService.getEscrowStateByAddress(escrowAddress);
    const escrowBalance = await blockchainService.getEscrowBalanceByAddress(escrowAddress);

    const state =
      typeof escrowState.state === 'string'
        ? escrowStateToNumber(escrowState.state)
        : escrowState.state;
    const amount = BigInt(escrowBalance);
    const hasFunds = amount > BigInt(0);
    const fiatPaid = escrowState.fiatPaid || false;

    return { state, amount, hasFunds, fiatPaid };
  } catch (error) {
    console.error(`[ERROR] Failed to check Solana escrow state for ${escrowAddress}:`, error);
    throw error;
  }
};

/**
 * Cancels an escrow on the Solana blockchain.
 * First checks if the escrow has funds and prevents cancellation if it does.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to cancel
 * @returns The transaction hash and block number
 */
export const cancelEscrowTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<{ txHash: string; blockNumber: bigint }> => {
  try {
    // First check if the escrow has funds
    const { hasFunds } = await checkEscrowState(wallet, escrowId.toString());
    if (hasFunds) {
      throw new Error(
        'Cannot cancel an escrow that still has funds. The funds must be released first.'
      );
    }


    const sellerTokenAccount = await deriveTokenAccount(wallet.address, 'USDT');

    const result = await blockchainService.cancelEscrow({
      escrowId: Number(escrowId),
      tradeId: 0, // We'll need to get this from the escrow data
      sellerAddress: wallet.address,
      authorityAddress: wallet.address,
      sellerTokenAccount: sellerTokenAccount,
      useRelay: await shouldUseRelay(wallet),
    });


    return {
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
    };
  } catch (error) {
    console.error(`[ERROR] Failed to cancel Solana escrow ${escrowId}:`, error);
    throw error;
  }
};
