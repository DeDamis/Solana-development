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

const devKeys = new Keypair();
const pubKey = new PublicKey(devKeys._keypair.publicKey).toString();
const privKey = devKeys._keypair.secretKey;

const getWalletBalance = async() => {
    try{
        const connection = new Connection(clusterApiUrl("devnet"),"confirmed");
        const myWallet = Keypair.fromSecretKey(privKey);
        const walletBalance = await connection.getBalance(myWallet.publicKey);
        console.log(`Wallet address is ${myWallet.publicKey.toString()} and balance is ${walletBalance}`);
    } catch(err) {
        console.log(err);
    }
}

getWalletBalance();

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

//requestAirdrop();
//getWalletBalance();