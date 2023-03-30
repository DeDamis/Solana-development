const {
    Connection,
    PublicKey,
    clusterApiUrl,
    LAMPORTS_PER_SOL
} = require("@solana/web3.js");



const walletAddress = new PublicKey("5z8bo2YcH5An3qLeWM5x3MC7zwBt3vkPgswpdqupUmFF")




// Token program currently commonly used on Solana for token account creation
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const getTokens = async(publicKey) => {
    try {
        const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, 
        {
            programId: new PublicKey(TOKEN_PROGRAM) // filter specification, token accounts created by TOKEN_PROGRAM
        })
        return {tokenAccounts: tokenAccounts}
    } catch (err) {
        console.log(err);
    }
}

const SolanaMintAddressesURL = "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json";

const main = async() => {
    const {tokenAccounts} = await getTokens(walletAddress);
    const nonZeroAccounts = tokenAccounts?.value?.filter(
        (obj) => obj.account.data.parsed.info.tokenAmount.uiAmount >= 0
    );
    // let mapAccountData = nonZeroAccounts.map((obj) => obj.account.data.parsed.info); // look into objects
    // find specific token
    // Lookup Mint public key https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json
    /*
    for(let acct of nonZeroAccounts){
        if(acct.account.data.parsed.info.mint == "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"){
            console.log(`$USDC token ammount is ${acct.account.data.parsed.info.tokenAmount.uiAmount}`);
        }
    };
    */

    // print all token accounts
    for(acct of nonZeroAccounts){
        console.log(`The token ${acct.account.data.parsed.info.mint} exists and has balance ${acct.account.data.parsed.info.tokenAmount.uiAmount}`)
    }

}

main();