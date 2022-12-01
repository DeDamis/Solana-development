from theblockchainapi import SolanaNetwork, SolanaAPIResource
from blockchainAPI import KEY_ID, SECRET_KEY
import pandas as pd
import json

BLOCKCHAIN_API_RESOURCE = SolanaAPIResource(
    api_key_id=KEY_ID,
    api_secret_key=SECRET_KEY,
)

def get_NFT_metadata(nft_address):
    nft_metadata = BLOCKCHAIN_API_RESOURCE.get_nft_metadata(
        mint_address=nft_address,
        network=SolanaNetwork.MAINNET_BETA
    )
    #data = nft_metadata['data']
    #print(data)
    df = pd.DataFrame({"symbol":nft_metadata['data']['symbol'], "name":nft_metadata['data']['name'], "image":nft_metadata['off_chain_data']['image']}, index=[0])
    #print(df)
    return df
    

if __name__ == "__main__":
    get_NFT_metadata("EXoPCSPngcFfKfRjsgy314DsPumWjY87Q8xbn4ZXViXb")
    pass