import * as dotenv from "dotenv";
import algosdk from "algosdk";

dotenv.config({ path: "./.env.local" });

/**
 * Burns a specified amount of tokens.
 * @param {number} amount - The amount of tokens to burn.
 */
const burnTokens = async (amount) => {
  try {
    // Load environment variables
    const algodToken = process.env.NEXT_PUBLIC_ALGOD_TOKEN;
    const algodServer = process.env.NEXT_PUBLIC_ALGOD_ADDRESS;
    const algodPort = process.env.NEXT_PUBLIC_ALGOD_PORT;
    const deployerMnemonic = process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC;
    const assetId = parseInt(process.env.NEXT_PUBLIC_ASSET_ID);
    const burnAddress = process.env.NEXT_PUBLIC_BURN_CONTRACT_ADDRESS;

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

    // Get deployer account from mnemonic
    const deployerAccount = algosdk.mnemonicToSecretKey(deployerMnemonic);

    // Get suggested transaction parameters
    const params = await algodClient.getTransactionParams().do();

    // Create the asset transfer transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      deployerAccount.addr,
      burnAddress,   // Receiver is the burn contract
      undefined,
      undefined,
      amount,
      undefined,
      assetId,
      params
    );

    // Sign the transaction
    const signedTxn = txn.signTxn(deployerAccount.sk);

    // Send the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction sent with ID:", txId);

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log("Tokens burned successfully:", confirmedTxn);

  } catch (error) {
    console.error("Failed to burn tokens:", error);
  }
};

// Execute the burn function with a predefined amount
(async () => {
  const amount = 100; // Amount of tokens to burn
  await burnTokens(amount);
})();
