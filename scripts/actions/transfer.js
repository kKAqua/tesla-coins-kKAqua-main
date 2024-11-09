import * as dotenv from "dotenv";
import algosdk from "algosdk";

dotenv.config({ path: "./.env.local" });

/**
 * Transfers a specified amount of tokens to a receiver.
 * @param {string} receiver - The address of the receiver.
 * @param {number} amount - The amount of tokens to transfer.
 */
const transferTokens = async (receiver, amount) => {
  try {
    // Load environment variables
    const algodToken = process.env.NEXT_PUBLIC_ALGOD_TOKEN;
    const algodServer = process.env.NEXT_PUBLIC_ALGOD_ADDRESS;
    const algodPort = process.env.NEXT_PUBLIC_ALGOD_PORT;
    const deployerMnemonic = process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC;
    const assetId = parseInt(process.env.NEXT_PUBLIC_ASSET_ID);

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

    // Retrieve deployer account from mnemonic
    const deployerAccount = algosdk.mnemonicToSecretKey(deployerMnemonic);

    // Fetch suggested transaction parameters
    const params = await algodClient.getTransactionParams().do();

    // Create the asset transfer transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      deployerAccount.addr,
      receiver,
      undefined,
      undefined,
      amount,
      undefined,
      assetId,
      params
    );

    // Sign the transaction
    const signedTxn = txn.signTxn(deployerAccount.sk);

    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction sent with ID:", txId);

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log("Transfer completed successfully:", confirmedTxn);

  } catch (error) {
    console.error("Failed to transfer tokens:", error);
  }
};

// Execute the token transfer with predefined values
(async () => {
  const receiver = process.env.NEXT_PUBLIC_HOLDINGS_CONTRACT_ADDRESS;
  const amount = 100; // Amount of TESLA tokens to transfer
  await transferTokens(receiver, amount);
})();
