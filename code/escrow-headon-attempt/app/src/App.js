import { Buffer } from 'buffer';

import './App.css';
import {useState} from "react";
import {Connection, PublicKey, Transaction} from '@solana/web3.js';

import {LAMPORTS_PER_SOL, SYSVAR_RENT_PUBKEY , sendAndConfirmTransaction} from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import {TOKEN_PROGRAM_ID, MINT_SIZE} from "@solana/spl-token"; 
import {Program, AnchorProvider, web3} from '@coral-xyz/anchor';
import idl from "./idl.json"; 



import {PhantomWalletAdapter, SolflareWalletAdapter} from '@solana/wallet-adapter-wallets';
import {useWallet, WalletProvider, ConnectionProvider} from '@solana/wallet-adapter-react';
import {WalletModalProvider, WalletMultiButton} from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

window.Buffer = Buffer;

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
];

const {Keypair, SystemProgram} = web3;

const programId = new PublicKey(idl.metadata.address);
let token_mint;

const opts = {
  preflightCommitment: "confirmed"
}

const network = "http://127.0.0.1:8899"

const Escrow = () => {
  const [message, setMessage] = useState(null);
  const [extraInfo, setExtraInfo] = useState(null);
  const [mintAddress, setMintAddress] = useState(null);
  const wallet = useWallet();
  async function getProvider() {
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, wallet, opts.preflightCommitment)
    return provider;
  }

  const requestSOLairdrop = async () => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Airdropping $SOL.");
    try {
      await provider.connection.requestAirdrop(wallet.publicKey, 1 * LAMPORTS_PER_SOL);
      setMessage("$SOL airdropped.");
    } catch (error) {
      setMessage(`Error airdropping $SOL: ${error.message}`);
    }
  };

  const createToken = async () => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Creating a new token.");
    try {
        let blockhash = await provider.connection.getLatestBlockhash().then((res) => res.blockhash);
        const mint = new Keypair();
        // init account
        const createMintAccountInstructionData = SystemProgram.createAccount({
            fromPubkey: provider.wallet.publicKey,
            newAccountPubkey: mint.publicKey,
            space: MINT_SIZE,
            lamports: await splToken.getMinimumBalanceForRentExemptMint(provider.connection),
            programId: TOKEN_PROGRAM_ID,
        });
        const createMintAccountInstruction = new web3.TransactionInstruction({
            keys: createMintAccountInstructionData.keys,
            programId: createMintAccountInstructionData.programId,
            data: createMintAccountInstructionData.data,
        });

        const initializeMintInstruction = splToken.createInitializeMintInstruction(
            mint.publicKey,
            6,
            provider.wallet.publicKey,
            provider.wallet.publicKey,
            TOKEN_PROGRAM_ID,
          );

        let transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: provider.wallet.publicKey
        });
        transaction.add(createMintAccountInstruction);
        transaction.add(initializeMintInstruction);
        await provider.wallet.signTransaction(transaction);
        transaction.partialSign(mint); // Sign the transaction with the mint Keypair
        const wireTransaction = transaction.serialize(); // Serialize the transaction
        const signature = await provider.connection.sendRawTransaction(wireTransaction);
        await provider.connection.confirmTransaction(signature, opts.preflightCommitment);
        //..
        let mintAccount = await splToken.getMint(provider.connection, mint.publicKey);
        console.log(mintAccount);
        //setTokenMint(mintAccount.address.toString())
        setMessage("Token created.");
    } catch (error) {
        setMessage(`Error creating a new token: ${error.message}`);
    }
  };

  const createUserAccount = async (mintAddress) => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Creating an user token account.");
    try {
        let ata = await splToken.createAssociatedTokenAccount(
            provider.connection, // connection
            provider.wallet.publicKey, // fee payer
            mintAddress, // mint
            provider.wallet.publicKey // owner,
          );
      setMessage("User token account created.");
    } catch (error) {
      setMessage(`Error creating a new token account: ${error.message}`);
    }
  };

  const airdropToken = async () => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Airdropping token to the user token account...");
    try {
      // Add logic 

      setMessage("Token airdropped.");
    } catch (error) {
      setMessage(`Error airdropping tokens: ${error.message}`);
    }
  };

  const initializeEscrow = async () => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Initializing escrow...");
    try {
      // Add logic to initialize escrow
      // ...

      setMessage("Escrow initialized.");
    } catch (error) {
      setMessage(`Error initializing escrow: ${error.message}`);
    }
  };

  const retrieveFromEscrow = async () => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Retrieving tokens from escrow...");
    try {
      // Add logic to retrieve tokens from escrow
      // ...

      setMessage("Tokens retrieved.");
    } catch (error) {
      setMessage(`Error retrieving tokens: ${error.message}`);
    }
  };

  if (!wallet.connected){
    return(
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
      <WalletMultiButton />
      </div>
    )
  }
  else {
    return (
      <div className='Escrow'>
        <div>
          <button onClick={requestSOLairdrop}>Airdrop $SOL to user wallet</button>
          <button onClick={createToken}>Create a new token</button>
          <button onClick={createUserAccount(mintAddress)}>Create user token account</button>
          <button onClick={airdropToken}>Mint token to the account</button>
          <button onClick={initializeEscrow}>Initialize Escrow</button>
          <button onClick={retrieveFromEscrow}>Retrieve Tokens</button>
          <p>{message}</p>
          <p>Additional info: {extraInfo}</p>
        </div>
      </div>
    );
  }
  /*

            <textarea
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            placeholder="Enter mint address here"
          />
  */


};

const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <Escrow />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;

// In case of an error: Module not found: Error: Can't resolve 'crypto'
// Add the following callback to the webpack config file at ../node_modules/react-scripts/config/webpack.config.js
/*
fallback: {
  assert: require.resolve('assert'),
  crypto: require.resolve('crypto-browserify'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify/browser'),
  stream: require.resolve('stream-browserify'),
},
*/
// When needed install the needed fallback libraries by: npm install <library>