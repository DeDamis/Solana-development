/// sns.js 
/// Authored by Damis

/// This file contains a code snippet for performing an SNS lookup on the Solana blockchain

/// The process explained:
/// 1) Solana domain name has to be hashed
/// 2) Solana TLD authority is asked for the account key for the given hashed name
///    - this process has to perform a security check of the signing authority to eliminate man-in-the-middle attacks (similar to DNS spoofing)
/// 3) At last we perform the retrieve action against the account key, as a response, we get the registry object

const {
    getHashedName,
    getNameAccountKey,
    NameRegistryState
} = require("@solana/spl-name-service")

const {
    Connection,
    PublicKey,
    clusterApiUrl
} = require("@solana/web3.js")

// Address of the SOL TLD
const SOL_TLD_AUTHORITY = new PublicKey(
    "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx"
);

const accountName = "adamis.sol";

const getDomainKey = async(domain) => {
    let hashedDomain = await getHashedName(domain);             
    let inputDomainKey = await getNameAccountKey(
        hashedDomain, // hashed name
        undefined, // name class -> we don't need to specify it
        SOL_TLD_AUTHORITY); // signing authority
    return {inputDomainKey: inputDomainKey, hashedInputName: hashedDomain};
};

const main = async() => {
    const connection = new Connection(clusterApiUrl("mainnet-beta"),"confirmed");
    const {inputDomainKey} = await getDomainKey(accountName.replace(".sol", "")); // DomainKey
    const registry = await NameRegistryState.retrieve(connection, inputDomainKey); // SNS retrieve
    console.log(registry.owner.toBase58());
}

main();