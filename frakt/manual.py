import base64
import base58
import struct
import json
import asyncio
import pandas as pd
from time import sleep
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

def getFullLiquidationLotDataFromFile(filename):
    dfAll = pd.DataFrame()
    f = open(filename, "r")
    pkLiquidationLot = f.readline().rstrip('\n')
    while pkLiquidationLot:
        #print(pkLiquidationLot)
        df = parseLiquidationLot(pkLiquidationLot)
        df3 = df
        try:
            df2 = get_NFT_metadata(df['nftMint'].to_string(index=False))
            df3 = pd.merge(df2, df, how="inner", left_on='nftMint', right_on='nftMint')
        except:
            pass
        dfAll = pd.concat([dfAll, df3], ignore_index=True, copy=True)
        pkLiquidationLot = f.readline()
    return dfAll

def getFullRaffleDataFromFile(filename):
    df_all = pd.DataFrame()
    f = open(filename, "r")
    public_key_raffle_account = f.readline().rstrip('\n')
    while public_key_raffle_account:
        df = parseRaffleAccount(public_key_raffle_account)
        time.sleep(SOLANA_PUBLIC_API_DELAY)
        df3 = df
        try:
            df2 = get_NFT_metadata(df['nftMint'].to_string(index=False))
            df3 = pd.merge(df2, df, how="inner", left_on='nftMint', right_on='nftMint')
            time.sleep(BLOCKCHAIN_API_DELAY)
        except:
            pass
        df_all = pd.concat([df_all, df3], ignore_index=True, copy=True)
        public_key_raffle_account = f.readline().rstrip('\n')
    return df_all

def getPartialLiquidationLotDataFromFile(filename):
    dfAll = pd.DataFrame()
    f = open(filename, "r")
    pkLiquidationLot = f.readline().rstrip('\n')
    while pkLiquidationLot:
        print(pkLiquidationLot)
        df = parseLiquidationLot(pkLiquidationLot)
        pkLiquidationLot = f.readline()
        dfAll = pd.concat([dfAll, df], ignore_index=True, copy=True)
    return dfAll


if __name__ == "__main__":
    #data = getPartialLiquidationLotDataFromFile("./data/ActiveLots.txt")
    #print(data)
    refresh=29
    while True:
        #data2 = getFullLiquidationLotDataFromFile("./data/ActiveLots.txt")
        data2 = getFullRaffleDataFromFile("./temp/ActiveRaffles.txt")
        print(data2[['name', 'status', 'ticketsAmount', 'usersAmount', 'depositAmount', 'raffleAccount']])
        for i in range(0,refresh):
            print("Refreshing in "+str(refresh-i)+" seconds...", end='\r')
            sleep(1)
    pass