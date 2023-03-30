import './App.css';
import {useState} from "react";
import {Connection, PublicKey} from '@solana/web3.js';
// import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import {Program, AnchorProvider, web3} from '@coral-xyz/anchor';
import idl from "./idl.json"; 

import {PhantomWalletAdapter, SolflareWalletAdapter} from '@solana/wallet-adapter-wallets';
import {useWallet, WalletProvider, ConnectionProvider} from '@solana/wallet-adapter-react';
import {WalletModalProvider, WalletMultiButton} from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
];

const {Keypair, SystemProgram} = web3;

const programId = new PublicKey(idl.metadata.address);

const opts = {
  preflightCommitment: "Processed"
}

const network = "http://127.0.0.1:8899"

const Escrow = () => {
  const [message, setMessage] = useState(null);
  const wallet = useWallet();
  async function getProvider() {
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, wallet, opts.preflightCommitment)
    return provider;
  }

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
          <button onClick={initializeEscrow}>Initialize Escrow</button>
          <button onClick={retrieveFromEscrow}>Retrieve Tokens</button>
          <p>{message}</p>
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


