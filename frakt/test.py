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
from liquidationLot import parseRaffleAccount

BLOCKCHAIN_API_DELAY=2.5 # time in [s]
SOLANA_PUBLIC_API_DELAY=0.5 # time in [s]

TRANSACTION_RAFFLE_ACCOUNT_ADDRESS_INDEX=1
TRANSACTION_NFT_MINT_ADDRESS_INDEX=2

async def main():
    f = open("./temp/allTransactionsParsed.txt", "r")
    data = f.read()
    data = json.loads(data)
    #print(data[0])
    #json_formatted_str = json.dumps(data[0], indent=2)
    #print(json_formatted_str)
    
    initializeRaffle = []
    initializeRaffleCounter = 0
    print("Detection:")
    for index, transaction in enumerate(data):
        if data[index]['meta']['err'] == None:
            for message in data[index]['meta']['logMessages']:
                if message == "Program log: Instruction: InitializeRaffle":
                    initializeRaffleCounter += 1
                    initializeRaffle.append(data[index])
            print("InitializeRaffle: "+str(initializeRaffleCounter), end='\r')
    print("")
    #print(initializeRaffle[0]['transaction']['message']['accountKeys'][TRANSACTION_RAFFLE_ACCOUNT_ADDRESS_INDEX]['pubkey'])
    dfAll = pd.DataFrame()
    for index, transaction in enumerate(initializeRaffle):
        print("["+str(index+1)+"/"+str(initializeRaffleCounter)+"] Fetching info for \"InitializeRaffle\"", end='\r')
        exceptThrown=True
        df2 = parseRaffleAccount(transaction['transaction']['message']['accountKeys'][TRANSACTION_RAFFLE_ACCOUNT_ADDRESS_INDEX]['pubkey'])
        time.sleep(SOLANA_PUBLIC_API_DELAY)
        df = pd.DataFrame({"nftMint":"0"}, index=[0])
        status = df2['status'].to_string(index=False)
        if status == "started" or status == "endedWithSold":
            try:
                #mint_address=transaction['transaction']['message']['accountKeys'][TRANSACTION_NFT_MINT_ADDRESS_INDEX]['pubkey']
                mint_address=df2['nftMint'].to_string(index=False)
                #print(mint_address)
                df = get_NFT_metadata(mint_address)
                time.sleep(BLOCKCHAIN_API_DELAY)
                exceptThrown=False
            except Exception as e:
                print(e)
                pass
        #print(df)
        #print(df2)
        df3 = pd.merge(df, df2, how="inner", left_on='nftMint', right_on='nftMint')
        #print(df3)
        if exceptThrown:
            dfAll = pd.concat([dfAll, df2], ignore_index=True, copy=True)
        else:
            dfAll = pd.concat([dfAll, df3], ignore_index=True, copy=True)
    print("")
    if 'name' in dfAll.columns:
        print(dfAll[["name", "status", "ticketsAmount", "usersAmount", "depositAmount", "raffleAccount"]])
    else:
        print(dfAll[["status", "ticketsAmount", "usersAmount", "depositAmount", "raffleAccount"]])
    dfAll.to_csv("./temp/output.csv")
    justActive = dfAll[dfAll["status"] == "started"]
    justActive = justActive['raffleAccount']
    f_write = open("./temp/ActiveRaffles.txt", "a")
    for i in range(0, justActive.shape[0]):
        #print(justActive[i:i+1].to_string(index=False))
        f_write.write(justActive[i:i+1].to_string(index=False)+"\n")
        pass

if __name__ == "__main__":
    asyncio.run(main())