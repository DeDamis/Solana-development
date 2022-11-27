/// index.js
/// Authored by Damis

/// This file contains a code snippet for initializating connection with GenesysGo Premium RPC server

import dotenv from "dotenv";
dotenv.config();
import web3, { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Fs from "@supercharge/fs"; // IO File operations

// Initializace connection with GenesysGo Premium RPC server
async function getConnection(url) {
  try {
    const jwt = await Fs.content("jwt.txt");
    return new web3.Connection(url, {
      commitment: "finalized",
      httpHeaders: {
        header: process.env.APP_IDENTIFIER,
        Authorization: `Bearer ${jwt}`,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

(async () => {
  // Connect to cluster
  console.log("Connecting to GenesysGo premium RPC");
  const connection = await getConnection(process.env.RPC_URL);

  // A couple of demo calls
  let version = await connection.getVersion();
  console.log(version);

  //let balance = await connection.getBalance(
  //  new web3.PublicKey("3dzwuFAQMmbgQDKBVqjyVkwUyapgZjC7yWHe3M88Pdk5")
  //);
  //console.log(balance/LAMPORTS_PER_SOL);

  const publicKeyLending = new PublicKey("A66HabVL3DzNzeJgcHYtRRNW1ZRMKwBfrdSR4kLsZ9DJ");
  const publicKeyWallet = new PublicKey("3dzwuFAQMmbgQDKBVqjyVkwUyapgZjC7yWHe3M88Pdk5");

  // get last {limit: x} transactions of address
  let result = await connection.getSignaturesForAddress(publicKeyWallet, {limit : 10})
  console.log(result);

  Fs.writeFile("last_transactions.txt", result.toString());

})();
