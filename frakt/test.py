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
    liquidateNftToRaffles = []
    for index, transaction in enumerate(data):
        if data[index]['meta']['err'] == None:
            message = data[index]['meta']['logMessages'][1]
            if message == "Program log: Instruction: PutLoanToLiquidationRaffles":
                print("PutLoanToLiquidationRaffles detected!")
                putLoanToLiquidations.append(data[index])
            elif message == "Program log: Instruction: LiquidateNftToRaffles":
                liquidateNftToRaffles.append(data[index])
                print("LiquidateNftToRaffles detected!")
                #print(transaction)
                #print(str(index)+":"+transaction['meta']['logMessages'][1])
                #print(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
                #print(transaction['transaction']['message']['accountKeys'][12]['pubkey'])
    dfAll = pd.DataFrame()
    #print(putLoanToLiquidations[0])
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
    
    #print(liquidateNftToRaffles[2]['transaction'])
    #print("")
    for index, transaction in enumerate(liquidateNftToRaffles):
        #print(transaction['transaction']['signatures'][0])
            #print(transaction['transaction']['message']['accountKeys'][12]['pubkey'])
        exceptThrown=False
        try:
            df = get_NFT_metadata(transaction['transaction']['message']['accountKeys'][12]['pubkey'])
        except:
            exceptThrown=True
            pass
            #print(df)
            #print(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
        df2 = parseLiquidationLot(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
        df3 = pd.merge(df, df2, how="inner", left_on='nftMint', right_on='nftMint')
        if exceptThrown:
            dfAll = pd.concat([dfAll, df2], ignore_index=True, copy=True)
        else:
            dfAll = pd.concat([dfAll, df3], ignore_index=True, copy=True)
    print(dfAll[["name", "lotState", "ticketsCount", "liquidationLot"]])


if __name__ == "__main__":
    asyncio.run(main())