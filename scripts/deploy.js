import * as dotenv from "dotenv";
import algosdk from "algosdk";
import { spawnSync } from "child_process";
dotenv.config({ path: "./.env.local" });

const deployContracts = async () => {
  try {
    const algodToken = process.env.NEXT_PUBLIC_ALGOD_TOKEN;
    const algodServer = process.env.NEXT_PUBLIC_ALGOD_ADDRESS;
    const algodPort = process.env.NEXT_PUBLIC_ALGOD_PORT;
    const deployerMnemonic = process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC;

    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

    const deployerAccount = algosdk.mnemonicToSecretKey(deployerMnemonic);

    const params = await algodClient.getTransactionParams().do();

    const mintAppId = await deployMintContract(algodClient, deployerAccount, params);
    console.log("Mint contract deployed with App ID:", mintAppId);

    const holdingsAppId = await deployHoldingsContract(algodClient, deployerAccount, params);
    console.log("Holdings contract deployed with App ID:", holdingsAppId);

    const burnAppId = await deployBurnContract(algodClient, deployerAccount, params);
    console.log("Burn contract deployed with App ID:", burnAppId);

    const assetId = await createAsset(algodClient, deployerAccount, params);
    console.log("TESLA asset created with Asset ID:", assetId);

    await initializeContracts(algodClient, deployerAccount, mintAppId, holdingsAppId, burnAppId, assetId);

  } catch (error) {
    console.error("Failed to deploy contracts:", error);
  }
};

const deployMintContract = async (algodClient, deployerAccount, params) => {
  const result = spawnSync("python3", ["MintApp.py"], { encoding: "utf-8" });
  if (result.error) throw result.error;
  if (result.stderr) throw new Error(result.stderr);

  const approvalProgram = await readFile("./artifacts/MintApp.approval.teal");
  const clearProgram = await readFile("./artifacts/MintApp.clear.teal");

  const compiledApprovalProgram = await algodClient.compile(approvalProgram).do();
  const compiledClearProgram = await algodClient.compile(clearProgram).do();

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: deployerAccount.addr,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: new Uint8Array(Buffer.from(compiledApprovalProgram.result, "base64")),
    clearProgram: new Uint8Array(Buffer.from(compiledClearProgram.result, "base64")),
    numGlobalInts: 5, // total_supply, creator, asset_created, holding_address, burn_address
    numGlobalByteSlices: 1, // global_text
    numLocalInts: 0,
    numLocalByteSlices: 0,
  });

  const signedTxn = txn.signTxn(deployerAccount.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  return confirmedTxn["application-index"];
};

const deployHoldingsContract = async (algodClient, deployerAccount, params) => {
  const result = spawnSync("python3", ["HoldingsApp.py"], { encoding: "utf-8" });
  if (result.error) throw result.error;
  if (result.stderr) throw new Error(result.stderr);

  const approvalProgram = await readFile("./artifacts/HoldingsApp.approval.teal");
  const clearProgram = await readFile("./artifacts/HoldingsApp.clear.teal");

  const compiledApprovalProgram = await algodClient.compile(approvalProgram).do();
  const compiledClearProgram = await algodClient.compile(clearProgram).do();

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: deployerAccount.addr,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: new Uint8Array(Buffer.from(compiledApprovalProgram.result, "base64")),
    clearProgram: new Uint8Array(Buffer.from(compiledClearProgram.result, "base64")),
    numGlobalInts: 3, // asset_id, price, creator
    numGlobalByteSlices: 1, // global_text
    numLocalInts: 0,
    numLocalByteSlices: 0,
  });

  const signedTxn = txn.signTxn(deployerAccount.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  return confirmedTxn["application-index"];
};

const deployBurnContract = async (algodClient, deployerAccount, params) => {
  const result = spawnSync("python3", ["BurnApp.py"], { encoding: "utf-8" });
  if (result.error) throw result.error;
  if (result.stderr) throw new Error(result.stderr);

  const approvalProgram = await readFile("./artifacts/BurnApp.approval.teal");
  const clearProgram = await readFile("./artifacts/BurnApp.clear.teal");

  const compiledApprovalProgram = await algodClient.compile(approvalProgram).do();
  const compiledClearProgram = await algodClient.compile(clearProgram).do();

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: deployerAccount.addr,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: new Uint8Array(Buffer.from(compiledApprovalProgram.result, "base64")),
    clearProgram: new Uint8Array(Buffer.from(compiledClearProgram.result, "base64")),
    numGlobalInts: 2, // asset_id, creator
    numGlobalByteSlices: 1, // global_text
    numLocalInts: 0,
    numLocalByteSlices: 0,
  });

  const signedTxn = txn.signTxn(deployerAccount.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  return confirmedTxn["application-index"];
};

const createAsset = async (algodClient, deployerAccount, params) => {
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: deployerAccount.addr,
    total: 1000000, 
    decimals: 0,
    assetName: "TESLA",
    unitName: "TSLA",
    assetURL: "https://tesla.com",
    manager: deployerAccount.addr,
    suggestedParams: params
  });

  const signedTxn = txn.signTxn(deployerAccount.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  return confirmedTxn["asset-index"];
};

const initializeContracts = async (algodClient, deployerAccount, mintAppId, holdingsAppId, burnAppId, assetId) => {
  console.log("Initializing contracts with Asset ID:", assetId);
  const appArgs = [algosdk.encodeUint64(assetId), algosdk.encodeUint64(5)]; //The initial price is 5

  const txn = algosdk.makeApplicationNoOpTxn(
    deployerAccount.addr,
    await algodClient.getTransactionParams().do(),
    holdingsAppId,
    appArgs
  );

  const signedTxn = txn.signTxn(deployerAccount.sk);
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
  await algosdk.waitForConfirmation(algodClient, txId, 4);
  console.log("Contracts initialized successfully.");
};

const fs = require("fs").promises;
const readFile = async (path) => {
  try {
    const data = await fs.readFile(path, "utf-8");
    return data;
  } catch (error) {
    console.error(`Error reading file from disk: ${error}`);
  }
};

(async () => {
  await deployContracts();
})();

