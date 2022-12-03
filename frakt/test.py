import base64
import base58
import struct
import json
import asyncio
import pandas as pd
import time

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
    liqNFTtoRaffles = 0
    putNFTtoRaffles = 0
    print("Detection:")
    for index, transaction in enumerate(data):
        if data[index]['meta']['err'] == None:
            message = data[index]['meta']['logMessages'][1]
            if message == "Program log: Instruction: PutLoanToLiquidationRaffles":
                putNFTtoRaffles += 1
                #print(str(putNFTtoRaffles)+"x: PutLoanToLiquidationRaffles detected!", end='\r')
                putLoanToLiquidations.append(data[index])
            elif message == "Program log: Instruction: LiquidateNftToRaffles":
                liqNFTtoRaffles += 1
                liquidateNftToRaffles.append(data[index])
                #print(str(liqNFTtoRaffles)+"x: LiquidateNftToRaffles detected!", end='\r')
                #print(transaction)
                #print(str(index)+":"+transaction['meta']['logMessages'][1])
                #print(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
                #print(transaction['transaction']['message']['accountKeys'][12]['pubkey'])
            print("LiquidateNftToRaffles: "+str(liqNFTtoRaffles)+" | "+"PutLoanToLiquidationRaffles: "+str(putNFTtoRaffles), end='\r')
    print("")
    dfAll = pd.DataFrame()
    #print(putLoanToLiquidations[0])
    for index, transaction in enumerate(putLoanToLiquidations):
        print("["+str(index+1)+"/"+str(putNFTtoRaffles)+"] Fetching info for \"PutLoanToLiquidationRaffles\"", end='\r')
        #print(str(index)+":"+transaction['meta']['logMessages'][1])
        #print(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
        #print(transaction['transaction']['message']['accountKeys'][9]['pubkey'])
        exceptThrown=True
        df2 = parseLiquidationLot(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
        time.sleep(0.5)
        df = pd.DataFrame({"nftMint":"0"}, index=[0])
        if df2['lotState'].to_string(index=False) == "active":
            try:
                df = get_NFT_metadata(transaction['transaction']['message']['accountKeys'][9]['pubkey'])
                time.sleep(2.5)
                exceptThrown=False
            except:
                pass
        #print(df)
        #print("")
        #print(df2)
        df3 = pd.merge(df, df2, how="inner", left_on='nftMint', right_on='nftMint')
        #print(df3)
        if exceptThrown:
            dfAll = pd.concat([dfAll, df2], ignore_index=True, copy=True)
        else:
            dfAll = pd.concat([dfAll, df3], ignore_index=True, copy=True)
    print("")
    #print(liquidateNftToRaffles[2]['transaction'])
    #print("")
    for index, transaction in enumerate(liquidateNftToRaffles):
        print("["+str(index+1)+"/"+str(liqNFTtoRaffles)+"] Fetching info for \"LiquidateNftToRaffles\"", end='\r')
        #print(transaction['transaction']['signatures'][0])
            #print(transaction['transaction']['message']['accountKeys'][12]['pubkey'])
        exceptThrown=True
        df2 = parseLiquidationLot(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
        time.sleep(0.5)
        df = pd.DataFrame({"nftMint":"0"}, index=[0])
        if df2['lotState'].to_string(index=False) == "active":
            try:
                df = get_NFT_metadata(transaction['transaction']['message']['accountKeys'][12]['pubkey'])
                time.sleep(2.5)
                exceptThrown=False
            except:
                pass
            #print(df)
            #print(transaction['transaction']['message']['accountKeys'][1]['pubkey'])
        df3 = pd.merge(df, df2, how="inner", left_on='nftMint', right_on='nftMint')
        if exceptThrown:
            dfAll = pd.concat([dfAll, df2], ignore_index=True, copy=True)
        else:
            dfAll = pd.concat([dfAll, df3], ignore_index=True, copy=True)
    if 'name' in df.columns:
        print(dfAll[["name", "lotState", "ticketsCount", "liquidationLot"]])
    else:
        print(dfAll[["lotState", "ticketsCount", "liquidationLot"]])
    dfAll.to_csv("./temp/output.csv")

if __name__ == "__main__":
    asyncio.run(main())