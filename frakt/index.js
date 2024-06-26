/// index.js
/// Authored by Damis

/// This file contains a code snippet for initializating connection with GenesysGo Premium RPC server

import dotenv from "dotenv";
dotenv.config();
import web3, { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Fs from "@supercharge/fs"; // IO File operations
import axios from "axios";
import moment from 'moment';

import * as raffle from "@frakters/raffle-sdk";

import { utils, loans, pools } from '@frakt-protocol/frakt-sdk';

const daysToCheck = 0.5;
const RPC_DELAY = 1000;

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

// Initializace connection with GenesysGo Premium RPC server
async function getConnection(url) {
  try {
    const jwt = await Fs.content("./data/jwt.txt");
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
  await delay(RPC_DELAY);

  const publicKeyLending = new PublicKey("A66HabVL3DzNzeJgcHYtRRNW1ZRMKwBfrdSR4kLsZ9DJ");
  const publicKeyDesiredWallet = new PublicKey("5spUuHreGH8nH6st6VujouLFj7fhXpQxdYBq9TWu6gqS");
  const publicKeyWallet = new PublicKey("3dzwuFAQMmbgQDKBVqjyVkwUyapgZjC7yWHe3M88Pdk5");
  const RaffleProgramPK = new PublicKey("raffyhEJMx59iDx778Y9gdaVcP2XDeusPcPBxwr3qAH");

  // get last {limit: x} transactions of address
  let latestBlockHash = await connection.getRecentPerformanceSamples(1);
  await delay(RPC_DELAY);
  let latestBlockTime = await connection.getBlockTime(latestBlockHash[0]['slot']);
  await delay(RPC_DELAY);
  
  let signatures_1000_pcs_block = await connection.getSignaturesForAddress(RaffleProgramPK, {limit : 100});
  await delay(RPC_DELAY);
  let AllDaySignatures = [];
  signatures_1000_pcs_block.forEach((signature) => AllDaySignatures.push(signature));
  console.log(`InstructionFetch:${signatures_1000_pcs_block.length}`)
  let lastSignatureBlockTime = signatures_1000_pcs_block[signatures_1000_pcs_block.length-1]['blockTime']
  let lastSignature = signatures_1000_pcs_block[signatures_1000_pcs_block.length-1]['signature']
  console.log(`CurrentBlockTime:${latestBlockTime} --> ${moment.unix(latestBlockTime).format("YYYY-MM-DD HH:mm:ss")}`)
  console.log(`LastFetchedBlockTime:${lastSignatureBlockTime} --> ${moment.unix(lastSignatureBlockTime).format("YYYY-MM-DD HH:mm:ss")}`)
  while(latestBlockTime - lastSignatureBlockTime < (86400*daysToCheck)){
    signatures_1000_pcs_block = await connection.getSignaturesForAddress(publicKeyDesiredWallet, {limit : 100, before : lastSignature})
    signatures_1000_pcs_block.forEach((signature) => AllDaySignatures.push(signature));
    lastSignatureBlockTime = signatures_1000_pcs_block[signatures_1000_pcs_block.length-1]['blockTime']
    lastSignature = signatures_1000_pcs_block[signatures_1000_pcs_block.length-1]['signature']
    signatures_1000_pcs_block = [];
    await delay(RPC_DELAY);
  }
  console.log(`InstructionFetchedTotalCount:${AllDaySignatures.length}`)
  console.log(`Writing to AllDaySignatures.txt...`)
  Fs.writeFile("./temp/AllDaySignatures.txt", JSON.stringify(AllDaySignatures));
  console.log(`Writing done.`)
  
  
  const heliusConnection = new Connection("https://rpc.helius.xyz/?api-key=");
  // let rr = await conn.getSignaturesForAddress(publicKeyWallet, {limit : 3}); // Helius alt
  console.log(`Parsing transactions....`)
  let allParsed = [];
  for(let i = 0; i < AllDaySignatures.length;i++){
    process.stdout.write(`[${i}/${AllDaySignatures.length}] Parsed...`);
     let oneParsed = await heliusConnection.getParsedTransaction(AllDaySignatures[i]['signature']); // HELIUS RPC
    // let oneParsed = await connection.getParsedTransaction(AllDaySignatures[i]['signature']); // GenesysGo RPC
    allParsed.push(oneParsed);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }
  process.stdout.write("\n"); // end the line
  console.log(`Writing to allTransactionsParsed.txt...`)
  Fs.writeFile("./temp/allTransactionsParsed.txt", JSON.stringify(allParsed));
  console.log(`Writing done.`)
  
})();
