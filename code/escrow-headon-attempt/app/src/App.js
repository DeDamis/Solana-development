import { Buffer } from 'buffer';

import './App.css';
import {useState} from "react";
import {Connection, PublicKey, Transaction} from '@solana/web3.js';

import {LAMPORTS_PER_SOL, SYSVAR_RENT_PUBKEY , sendAndConfirmTransaction, clusterApiUrl} from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import {TOKEN_PROGRAM_ID, MINT_SIZE, ASSOCIATED_TOKEN_PROGRAM_ID} from "@solana/spl-token"; 
import {Program, AnchorProvider, web3} from '@coral-xyz/anchor';
import * as anchor from "@coral-xyz/anchor";
import idl from "./idl.json";
import assert from 'assert';
import {PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID, mintNewEditionFromMasterEditionViaVaultProxyInstructionDiscriminator} from '@metaplex-foundation/mpl-token-metadata';



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
//const network = clusterApiUrl("devnet");

const Escrow = () => {
  const [message, setMessage] = useState(null);
  const [extraInfo, setExtraInfo] = useState(null);
  const [mintAddress, setMintAddress] = useState(null);
  const [amount, setAmount] = useState(null);
  const [escrowTA, setEscrowTA] = useState(null);
  const [tix, setTix] = useState(null);
  const [nftMint, setNFTmint] = useState(null);
  const [nftAddress, setNFTaddress] = useState(null);
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

  const getCounterForUser = async() => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);
    const seeds = [
      anchor.utils.bytes.utf8.encode("counter"),
      provider.wallet.publicKey.toBuffer(),
    ];
    const [counterPDA] = await PublicKey.findProgramAddress(seeds, program.programId);
    try {
      const counter = (await program.account.userEscrowCounter.fetch(counterPDA)).counter;
      //console.log(counter);
      setMessage(`PreviousCounter fetched = ${counter}`);
      return counter;
    } catch (error) {
      setMessage(`Error fetching: ${error.message}`);
    }
  }

  const getPreviousCounterForUser = async() => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);
    const seeds = [
      anchor.utils.bytes.utf8.encode("counter"),
      provider.wallet.publicKey.toBuffer(),
    ];
    const [counterPDA] = await PublicKey.findProgramAddress(seeds, program.programId);
    try {
      const counter = (await program.account.userEscrowCounter.fetch(counterPDA)).previousCounter;
      //console.log(counter);
      setMessage(`Counter fetched = ${counter}`);
      return counter;
    } catch (error) {
      setMessage(`Error fetching: ${error.message}`);
    }
  }

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
        setMintAddress(mintAccount.address.toString());
        setMessage("Token created.");
        setTix(signature)
    } catch (error) {
        setMessage(`Error creating a new token: ${error.message}`);
    }
  };

  const createUserAccount = async (mintAddress) => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Creating an user token account.");
    try {
        let blockhash = await provider.connection.getLatestBlockhash().then((res) => res.blockhash);
        const mint = new PublicKey(mintAddress);
        // calculate ATA (associated token address)
        let ata = await splToken.getAssociatedTokenAddress(
          mint, // mint pubkey
          provider.wallet.publicKey // owner
        );
        console.log(`ATA: ${ata.toBase58()}`);
        let createATAinstruction = splToken.createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey, // payer
            ata, // ata
            provider.wallet.publicKey, // owner
            mint // mint
          );
        let transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: provider.wallet.publicKey
        });
        transaction.add(createATAinstruction);
        await provider.wallet.signTransaction(transaction);
        const wireTransaction = transaction.serialize(); // Serialize the transaction
        const signature = await provider.connection.sendRawTransaction(wireTransaction);
        await provider.connection.confirmTransaction(signature, opts.preflightCommitment);
      setMessage("User token account created.");
      setTix(signature)
    } catch (error) {
      setMessage(`Error creating a new token account: ${error.message}`);
    }
  };

  const airdropToken = async (mintAddress) => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Airdropping token to the user token account...");
    try {
      let blockhash = await provider.connection.getLatestBlockhash().then((res) => res.blockhash);
      const mint = new PublicKey(mintAddress);
      // calculate ATA (associated token address)
      let ata = await splToken.getAssociatedTokenAddress(mint, provider.wallet.publicKey); 
      let mintToInstruction = splToken.createMintToCheckedInstruction(
        mint, // mint PubKey
        ata, // receiving tokena account
        provider.wallet.publicKey, // mint authority
        100e6, // amount 1e6 = 1 token in case of 6 decimal token
        6, // number of decimals
      );
      let transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: provider.wallet.publicKey
      });
      transaction.add(mintToInstruction);
      await provider.wallet.signTransaction(transaction);
      const wireTransaction = transaction.serialize(); // Serialize the transaction
      const signature = await provider.connection.sendRawTransaction(wireTransaction);
      await provider.connection.confirmTransaction(signature, opts.preflightCommitment);
      setMessage("Token airdropped.");
      setTix(signature);
    } catch (error) {
      setMessage(`Error airdropping tokens: ${error.message}`);
    }
  };

  const initEscrowCounter = async() => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider); 
    setMessage("Initializing Escrow Counter");
    try {
      // derive escrow counter PDA from seeds
      const seeds = [anchor.utils.bytes.utf8.encode("counter"), provider.wallet.publicKey.toBuffer(),];
      const [escrowCounterPDA] = await PublicKey.findProgramAddress(seeds, program.programId);
      //console.log(escrowCounterPDA.toString());
      const tx = await program.methods.initCounter()
      .accounts({
        user: provider.wallet.publicKey,
        userEscrowCounter: escrowCounterPDA,
        systemProgram: SystemProgram.programId.toString(),
      })
      .rpc();
      setTix(tx);
      setMessage("Escrow Counter successfully initialized");
    } catch (error) {
      setMessage(`Error initializing Escrow Counter: ${error.message}`);
    }
  }

  const getNFT = async(nftMint) => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);
    setMessage("Trying to retrieve NFT...");
    try {
      // retrieve counter and get escrow PDA
      const previousCounter = new anchor.BN(await getPreviousCounterForUser());
      let previousCounterBuffer = Buffer.from(previousCounter.toArrayLike(Uint8Array, "le", 8));
      const seeds = [
        anchor.utils.bytes.utf8.encode("escrow"),
        provider.wallet.publicKey.toBuffer(),
        previousCounterBuffer,];
      const [escrowPDA] = await PublicKey.findProgramAddress(seeds, program.programId)
      console.log("escrowPDA (in retrievation)="+escrowPDA.toString())
      // Get ATA for NFT 
      let nft_mint = (await program.account.escrow.fetch(escrowPDA)).nftMint;
      let ata = await splToken.getAssociatedTokenAddress(nft_mint, provider.wallet.publicKey); 
      // Derive counter PDA from seeds
      const seedsCounter = [anchor.utils.bytes.utf8.encode("counter"), provider.wallet.publicKey.toBuffer(),];
      const [counterPDA] = await PublicKey.findProgramAddress(seedsCounter, program.programId);
      const seedsMetadata =[anchor.utils.bytes.utf8.encode("metadata"), nft_mint.toBuffer()];
      const [metadataPDA] = await PublicKey.findProgramAddress(seedsMetadata, program.programId);
      const tx = await program.methods.getNft()
      .accounts({
          user: provider.wallet.publicKey,
          nftMint: nft_mint,
          metadataAccount: metadataPDA,
          escrow: escrowPDA,
          userEscrowCounter: counterPDA,
          userNftTokenAccount: ata,
          systemProgram: SystemProgram.programId.toString(),
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc({
        skipPreflight:true
      });
      setTix(tx);
      setMessage("NFT Retrieved.");
    } catch (error) {
      setMessage(`Error retrieving NFT: ${error.message}`);
    }
  }

  const initializeEscrow = async (mintAddress, amount) => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);
    const numberOfDecimals = 6;
  
    setMessage("Initializing escrow...");
    try {
      const numAmount = Number(amount);
      assert(numAmount > 0, 'Error: You have to provide an amount to escrow!');
      assert(mintAddress !== null && mintAddress.length > 0, 'Error: You have to provide a mint address!');
      const mint = new PublicKey(mintAddress);
      const nftMintKP = new Keypair();
      setNFTmint(nftMintKP.publicKey.toString());
      //let nft_ata = await splToken.getAssociatedTokenAddress(nftMintKP.publicKey, provider.wallet.publicKey); 
      let nft_ata = new Keypair();
      const token_amount = new anchor.BN(numAmount*(Math.pow(10,6)));
      let ata = await splToken.getAssociatedTokenAddress(mint, provider.wallet.publicKey); 
      const escrowTAKeypair = new Keypair();
      // Fetch the counter from the UserEscrowCounter account
      const counter = new anchor.BN(await getCounterForUser());
      //console.log(counter);
      const counterBuffer = Buffer.from(counter.toArrayLike(Uint8Array, "le", 8));
      const seeds = [
        anchor.utils.bytes.utf8.encode("escrow"),
        provider.wallet.publicKey.toBuffer(),
        counterBuffer
        //nftMintKP.publicKey.toBuffer(),
      ];
      // Derive escrow address
      const [escrow] = await PublicKey.findProgramAddress(seeds, program.programId);
      console.log("escrowPDA (in initialization)=",escrow.toString());
      // Derive counter address
      const seedsCounter = [
        anchor.utils.bytes.utf8.encode("counter"),
        provider.wallet.publicKey.toBuffer(),
      ];
      // Derive counter account address
      const [counterPDA] = await PublicKey.findProgramAddress(seedsCounter, program.programId);
      console.log("counterPDA (in initialization)=",counterPDA.toString());
      const tx = await program.methods.initializeTokenEscrow(token_amount)
      .accounts({
        user: provider.wallet.publicKey,
        tokenMint: mint,
        userToken: ata, // user token account == ata
        nftMint: nftMintKP.publicKey,
        escrow: escrow,
        userEscrowCounter: counterPDA,
        escrowedTokensTokenAccount: escrowTAKeypair.publicKey,
        userNftTokenAccount: nft_ata.publicKey,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        //associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId
      })
      .signers([escrowTAKeypair, nftMintKP])
      .rpc({
        skipPreflight:true
      });
      setEscrowTA(escrowTAKeypair.publicKey);
      setTix(tx);
      let c2 = new anchor.BN(await getCounterForUser());
      console.log(c2);
      setMessage("Escrow initialized.");
    } catch (error) {
      setMessage(`Error initializing escrow: ${error.message}`);
    }
  };

  const retrieveFromEscrow = async (nftAddress, escrowTA) => {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);

    setMessage("Retrieving tokens from escrow...");
    try {
      assert(nftAddress !== null && nftAddress.length > 0, 'Error: You have to provide the nft mint address!');
      const nft_mint = new PublicKey(nftAddress); 
      console.log('mint key to generate metadataPDA from=', nft_mint.toString());
      const seedsMetadata =[anchor.utils.bytes.utf8.encode("metadata"), nft_mint.toBuffer()];
      const [metadataPDA] = await PublicKey.findProgramAddress(seedsMetadata, program.programId);
      console.log('metadataPDA=', metadataPDA.toString());
      const nftMetadataNumber = (await program.account.tokenMetadata.fetch(metadataPDA)).escrowNumber
      const nftMetadataNumberBuffer = Buffer.from(nftMetadataNumber.toArrayLike(Uint8Array, "le", 8));
      //let previousCounterBuffer = Buffer.from(previousCounter.toArrayLike(Uint8Array, "le", 8));
      const seeds = [
        anchor.utils.bytes.utf8.encode("escrow"),
        provider.wallet.publicKey.toBuffer(),
        nftMetadataNumberBuffer,];
      const [escrowPDA] = await PublicKey.findProgramAddress(seeds, program.programId)
      console.log('escrowPDA=', escrowPDA.toString());
      let escrow_tokens_ata = (await program.account.escrow.fetch(escrowPDA)).escrowedTokensTokenAccount;
      let token_mint = (await program.account.escrow.fetch(escrowPDA)).tokenMint;
      // Derive counter PDA address
      const seedsCounter = [anchor.utils.bytes.utf8.encode("counter"), provider.wallet.publicKey.toBuffer(),];
      const [counterPDA] = await PublicKey.findProgramAddress(seedsCounter, program.programId);
      // Get user's NFT token account 
      let nft_ata = await splToken.getAssociatedTokenAddress(nft_mint, provider.wallet.publicKey); 
      let user_token_ata = await splToken.getAssociatedTokenAddress(token_mint, provider.wallet.publicKey); 
      const tx = await program.methods.retrieve()
      .accounts({
        user: provider.wallet.publicKey,
        nftMint: nft_mint,
        metadataAccount: metadataPDA,
        escrow: escrowPDA,
        userNftAta: nft_ata,
        escrowTokenAta: escrow_tokens_ata,
        userTokenAta: user_token_ata,
      })
      .rpc({
        skipPreflight:true
      })
      setTix(tx);
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
          <button onClick={() => createUserAccount(mintAddress)}>Create user token account</button>
          <button onClick={() => airdropToken(mintAddress)}>Mint token to the account</button>
          <button onClick={() => initializeEscrow(mintAddress, amount)}>Initialize Escrow</button>
          <button onClick={() => getNFT(nftMint)}>Get NFT</button>
          <button onClick={() => retrieveFromEscrow(nftAddress, escrowTA)}>Retrieve Tokens</button>
          <button onClick={getCounterForUser}>Get Escrow Counter</button>
          <button onClick={initEscrowCounter}>Init Escrow Counter</button>
          <p>{message}</p>
          <p>Additional info: {extraInfo}</p>
          <p>{mintAddress}</p>
          <textarea
            value={mintAddress === null ? '' : mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            placeholder="Enter mint address here"
          />
          <textarea
            value={amount === null ? '' : amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to escrow within the program"
          />
          <p>Escrow token account</p>
          <textarea
            value={escrowTA === null ? '' : escrowTA}
            onChange={(e) => setEscrowTA(e.target.value)}
            placeholder="Enter escrow token account address"
          />
          <p>tix: {tix}</p>
          <p>NFT mint address: {nftMint}</p>
          <textarea
            value={nftAddress === null ? '' : nftAddress}
            onChange={(e) => setNFTaddress(e.target.value)}
            placeholder="NFT mint address to retrieve"
          />
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