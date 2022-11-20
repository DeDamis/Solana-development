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

const accountName = "damis.sol"

