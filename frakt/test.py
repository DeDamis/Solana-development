import base64
import base58
import struct
import json
import asyncio
import pandas as pd

from solana.rpc.commitment import Confirmed
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import MemcmpOpts


from get_NFT_metadata import get_NFT_metadata
from liquidationLot import parseLiquidationLot

async def main():
    f = open("./temp/allTransactionsParsed.txt", "r")
    data = f.read()
    data = json.loads(data)
    #print(data[0])
    #json_formatted_str = json.dumps(data[30], indent=2)
    #print(json_formatted_str)
    #print(data[30]['meta']['logMessages'][1])
    putLoanToLiquidations = []
    for index, transaction in enumerate(data):
        if data[index]['meta']['logMessages'][1] == "Program log: Instruction: PutLoanToLiquidationRaffles":
            putLoanToLiquidations.append(data[index])
    dfAll = pd.DataFrame()
    for index, transaction in enumerate(putLoanToLiquidations):
        #print(str(index)+":"+transaction['meta']['logMessages'][1])
        #print(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
        #print(transaction['transaction']['message']['accountKeys'][9]['pubkey'])
        df = get_NFT_metadata(transaction['transaction']['message']['accountKeys'][9]['pubkey'])
        #print(df)
        #print("")
        df2 = parseLiquidationLot(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
        #print(df2)
        df3 = pd.merge(df, df2, how="inner", left_on='nftMint', right_on='nftMint')
        #print(df3)
        dfAll = pd.concat([dfAll, df3], ignore_index=True, copy=True)
    print(dfAll)


if __name__ == "__main__":
    asyncio.run(main())