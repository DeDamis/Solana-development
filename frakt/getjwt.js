/// getjwt.js
/// Authored by Sven Anders Robbestad (robbestad.com)

/// Retrieval of authentication token (jwt token) for connecting to GenesysGo RPC server
/// Correct data required in .env file
/// You can use .env.example, rename it to .env and fill out the values

import dotenv from "dotenv";
dotenv.config();
import Fs from "@supercharge/fs";
import axios from "axios";
import * as solana from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

(async function main() {
  const key = JSON.parse(process.env.WALLET_KEY);
  const wallet = solana.Keypair.fromSecretKey(new Uint8Array(key));
  const msg = new TextEncoder().encode(`Sign in to GenesysGo Shadow Platform.`);
  const message = bs58.encode(nacl.sign.detached(msg, wallet.secretKey));
  let body = {
    message,
    signer: wallet.publicKey.toString(),
  };
  const authResponse = await axios.post(
    `${process.env.API_URL_BASE}/signin`,
    body
  );
  if (authResponse.status !== 200) {
    console.error("Error occurred:", authResponse.status);
    return;
  }
  if (typeof authResponse.data?.token !== "string") {
    console.error("No valid auth token returned.");
    return;
  }
  const tokenResponse = await axios.post(
    `${process.env.API_URL_BASE}/premium/token/${process.env.RPC_ID}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${authResponse.data.token}`,
      },
    }
  );
  if (tokenResponse.status !== 200) {
    console.error("Error occurred:", tokenResponse.status);
    return;
  }
  if (typeof tokenResponse?.data?.token !== "string") {
    console.error("No valid jwt token returned");
    return;
  }
  Fs.writeFile("./data/jwt.txt", tokenResponse.data.token);
  console.log(
    `Success! New JWT (${tokenResponse.data.token.slice(0, 8)}...) is written to disk\n`
  );
})()

