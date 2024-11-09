import * as dotenv from "dotenv";
import algosdk from "algosdk";

dotenv.config({ path: "./.env.local" });

/**
 * Updates the price in the smart contract.
 * @param {number} newPrice - The new price to be set.
 */
const updatePrice = async (newPrice) => {
  try {
    // Load environment variables
    const algodToken = process.env.NEXT_PUBLIC_ALGOD_TOKEN;
    const algodServer = process.env.NEXT_PUBLIC_ALGOD_ADDRESS;
    const algodPort = process.env.NEXT_PUBLIC_ALGOD_PORT;
    const deployerMnemonic = process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC;
    const appId = parseInt(process.env.NEXT_PUBLIC_HOLDINGS_APP_ID);

    // Initialize Algorand client
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

    // Retrieve deployer account from mnemonic
    const deployerAccount = algosdk.mnemonicToSecretKey(deployerMnemonic);

    // Fetch suggested transaction parameters
    const params = await algodClient.getTransactionParams().do();

    // Encode the new price and create the application call transaction
    const appArgs = [algosdk.encodeUint64(newPrice)];
    const txn = algosdk.makeApplicationNoOpTxn(
      deployerAccount.addr,
      params,
      appId,
      appArgs
    );

    // Sign the transaction
    const signedTxn = txn.signTxn(deployerAccount.sk);

    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log("Transaction sent with ID:", txId);

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log("Price updated successfully:", confirmedTxn);

  } catch (error) {
    console.error("Failed to update price:", error);
  }
};

// Execute the price update with a predefined value
(async () => {
  const newPrice = 5; // Set a new price, e.g., 5 Algos
  await updatePrice(newPrice);
})();
