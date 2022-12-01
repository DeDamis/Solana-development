const {
    Connection,
    PublicKey,
    Account,
    connectionApiUrl,
    Transaction,
    Keypair,
    LAMPORTS_PER_SOL,
    clusterApiUrl,
    SYSVAR_EPOCH_SCHEDULE_PUBKEY
} = require("@solana/web3.js")

const Fs = require("@supercharge/fs");

const devKeys = new Keypair();
const pubKey = new PublicKey(devKeys._keypair.publicKey).toString();
const privKey = devKeys._keypair.secretKey;

console.log(privKey)
Fs.writeFile("privKey.txt", privKey.toString());

//const livePublicKey = new PublicKey("");

const getDevnetWalletBalance = async() => {
    try{
        const connection = new Connection(clusterApiUrl("devnet"),"confirmed");
        const myWallet = Keypair.fromSecretKey(privKey);
        const walletBalance = await connection.getBalance(myWallet.publicKey);
        console.log(`Wallet address is ${myWallet.publicKey.toString()} and balance is ${walletBalance}`);
    } catch(err) {
        console.log(err);
    }
}

const getLiveWalletBalance = async() => {
    try{
        const connection = new Connection(clusterApiUrl("mainnet-beta"),"confirmed");
        const walletBalance = await connection.getBalance(livePublicKey);
        console.log(`Wallet address is ${livePublicKey} and balance is ${walletBalance/LAMPORTS_PER_SOL} SOL`);
    } catch(err) {
        console.log(err);
    }
}

const requestAirdrop = async() => {
    try {
        const connection = new Connection(clusterApiUrl("devnet"),"confirmed");
        const myWallet = Keypair.fromSecretKey(privKey);
        const airdropSignatureResult = await connection.requestAirdrop(myWallet.publicKey, 5*LAMPORTS_PER_SOL);
        const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: airdropSignatureResult,
        });
    } catch (err) {
        console.log(err);
    }
}

const main = async() => {
    await getDevnetWalletBalance();
    //await getLiveWalletBalance();
    //await requestAirdrop();
    //await getWalletBalance();
}

main(); // call main function