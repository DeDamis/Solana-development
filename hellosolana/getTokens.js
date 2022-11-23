/// getTokens.js
/// Authored by Damis

/// This file contains a code snippet for getting token accounts associated under the main address (owner address)

// When processing, we are looking up for token accounts that were created by a specified program (by program address)
// and are owned by specified Solana address

const {
    Connection,
    PublicKey,
    clusterApiUrl,
    LAMPORTS_PER_SOL
} = require("@solana/web3.js");

const request = require('request');

// Token program currently commonly used on Solana for token account creation
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// When looking up token accounts, we are able to find only token accounts created by this program

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
    const {tokenAccounts} = await getTokens(new PublicKey("3dzwuFAQMmbgQDKBVqjyVkwUyapgZjC7yWHe3M88Pdk5"));
    const nonZeroAccounts = tokenAccounts?.value?.filter(
        (obj) => obj.account.data.parsed.info.tokenAmount.uiAmount > 0
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
    request.get({
        url: SolanaMintAddressesURL,
        json: true,
    },(err, res, data) => {
        if(err) {
            console.log('Error:', err);
        } else if (res.statusCode !== 200){
            console.log('Status', res.statusCode);
        } else {
             // data is already parsed as JSON:
            for(address of data.tokens) {
                for(acct of nonZeroAccounts){
                    if(address.address == acct.account.data.parsed.info.mint){
                        console.log(`The token ${address.symbol} exists and has balance ${acct.account.data.parsed.info.tokenAmount.uiAmount}`)
                    }
                }
            }
        }
    }
    );
}

main();