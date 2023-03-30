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
      const mint = new Keypair().publicKey;
      const instructions = [
        // create mint account
        SystemProgram.createAccount({
          fromPubkey: provider.wallet.publicKey,
          newAccountPubkey: mint,
          space: MINT_SIZE,
          lamports: await splToken.getMinimumBalanceForRentExemptMint(provider.connection),
          programId: TOKEN_PROGRAM_ID,
        }),
        // first I would like to get the "createAccount working"
        // init mint account 
        /*
        splToken.createInitializeMintInstruction(
          mint.publicKey,             // mint pubkey
          6,                          // decimals
          provider.wallet.publicKey,  // mint authority
          provider.wallet.publicKey   // freeze authority 
        )
        */
      ];
      let transaction = new Transaction({recentBlockhash: blockhash, feePayer: provider.wallet.publicKey});
      transaction.add(instructions)
      await provider.wallet.signTransaction(transaction);
      const signature = await provider.connection.sendTransaction(transaction, [provider.wallet.publicKey, mint]);
      await provider.connection.confirmTransaction(signature, opts.preflightCommitment);
      //..
      setMessage("Token created.");
    } catch (error) {
      setMessage(`Error creating a new token: ${error.message}`);
    }
  };

  const createUserAccount = async () => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Creating an user token account.");
    try {
      // Add logic 

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
          <button onClick={createUserAccount}>Create user token account</button>
          <button onClick={airdropToken}>Mint token to the account</button>
          <button onClick={initializeEscrow}>Initialize Escrow</button>
          <button onClick={retrieveFromEscrow}>Retrieve Tokens</button>
          <p>{message}</p>
          <p>Additional info: {extraInfo}</p>
        </div>
      </div>
    );
  }

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