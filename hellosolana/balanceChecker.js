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

const walletAddress = new PublicKey("5z8bo2YcH5An3qLeWM5x3MC7zwBt3vkPgswpdqupUmFF")

const getLiveWalletBalance = async(publicKey) => {
    try{
        const connection = new Connection(clusterApiUrl("mainnet-beta"),"confirmed");
        const walletBalance = await connection.getBalance(publicKey);
        console.log(`Wallet address is ${publicKey} and balance is ${walletBalance/LAMPORTS_PER_SOL} SOL`);
        console.log(`Available to transfer ${walletBalance/LAMPORTS_PER_SOL-0.000005}`);
    } catch(err) {
        console.log(err);
    }
}

const main = async() => {
    await getLiveWalletBalance(walletAddress);
}

main(); // call main function

