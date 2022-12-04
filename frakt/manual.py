import base64
import base58
import struct
import json
import asyncio
import pandas as pd
from time import sleep

from solana.rpc.commitment import Confirmed
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import MemcmpOpts


from get_NFT_metadata import get_NFT_metadata
from liquidationLot import parseLiquidationLot

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
    refresh=15
    while True:
        data2 = getFullLiquidationLotDataFromFile("./data/ActiveLots.txt")
        print(data2[['name', 'lotState', 'ticketsCount', 'liquidationLot']])
        for i in range(0,refresh):
            print("Refreshing in "+str(refresh-i)+" seconds...", end='\r')
            sleep(1)
    pass