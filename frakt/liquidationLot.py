import base64
import base58
import struct
import json
from solana.rpc.commitment import Confirmed
from solana.publickey import PublicKey
from solana.rpc.api import Client
import pandas as pd

"""
# data finder
    for r in range(0,30):
        i = r
        loan = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
        print(loan)
        i += 32
        nftMint = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
        print(nftMint)
        i += 32
        vaultNftTokenAccount = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
        print(vaultNftTokenAccount)
        i += 32
        print("moving to...."+str(r+1))
    """
    
def unpack_raffleAccount(data):
    # start index
    i = 8
    nftMint = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    nftMint = nftMint.decode()
    i += 32
    #print('nftMint: '+str(nftMint))
    startedAt = data[i:i+7]
    startedAt = startedAt.hex()
    i += 8
    #print('startedAt: '+str(startedAt))
    endAt = data[i:i+7]
    endAt = endAt.hex()
    i += 8
    #print('endAt: '+str(endAt))
    statusStates=["started", "endedWithSold", "endedWithoutSold", "rejected"]
    status = data[i:i+1]
    status = status.hex()
    i += 12
    #print('status: '+str(status))
    nftOwner = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    nftOwner = nftOwner.decode()
    i += 32
    #print('nftOwner: '+str(nftOwner))
    ticketsAmount = data[i:i+7]
    ticketsAmount = ticketsAmount.hex()
    i += 8
    #print('ticketsAmount: '+str(ticketsAmount))
    usersAmount = data[i:i+7]
    usersAmount = usersAmount.hex()
    i += 8
    #print('usersAmount: '+str(usersAmount))
    depositAmount = data[i:i+7]
    depositAmount = depositAmount.hex()
    i += 8
    #print('depositAmount: '+str(depositAmount))
    df = pd.DataFrame({'nftMint':nftMint, 'status':statusStates[int(str(status))], 'ticketsAmount':ticketsAmount }, index=[0])
    return df

def unpack_LiquidationLot(data):
    # start index
    i = 8
    loan = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    #print('loan: '+str(loan))
    i += 32
    nftMint = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    #print('nftMint: '+str(nftMint))
    i += 32
    vaultNftTokenAccount = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    #print('vaultNftTokenAccount: '+str(vaultNftTokenAccount))
    i += 32
    lotNoFeesPrice = data[i:i+5]
    lotNoFeesPrice = lotNoFeesPrice[::-1]
    lotNoFeesPrice = lotNoFeesPrice.hex()
    i+=8
    #print('lotNoFeesPrice: '+str(lotNoFeesPrice))
    winningChanceInBasePoints = data[i:i+1]
    winningChanceInBasePoints = winningChanceInBasePoints[::-1]
    winningChanceInBasePoints = winningChanceInBasePoints.hex()
    i+=8
    #print('winningChanceInBasePoints: '+str(winningChanceInBasePoints))
    startedAt = data[i:i+4]
    startedAt = startedAt[::-1]
    startedAt = startedAt.hex()
    i+=8
    #print('startedAt: '+str(startedAt))
    endingAt = data[i:i+4]
    endingAt = endingAt[::-1]
    endingAt = endingAt.hex()
    i+=8
    #print('endingAt: '+str(endingAt))
    lotState = data[i:i+1]
    lotState = lotState[::-1]
    lotState = lotState.hex()
    i+=12
    #print('lotState: '+str(lotState))
    #print('lotState: '+str(int(str(lotState))))
    # lotstate:
    #    0 : not active
    #    1 : active
    #    2 : redeemed
    #    3 : paid back
    lotstate=["not active", "active", "redeemed", "paid back"]
    #idk
    ticketsCount = data[i:i+1]
    ticketsCount = ticketsCount[::-1]
    ticketsCount = ticketsCount.hex()
    i+=1
    #print('ticketsCount: '+str(ticketsCount))
    gracePeriod = data[i:i+3]
    gracePeriod = gracePeriod[::-1]
    gracePeriod = gracePeriod.hex()
    i+=8
    #print('gracePeriod: '+str(gracePeriod))
    graceFee = data[i:i+2]
    graceFee = graceFee[::-1]
    graceFee = graceFee.hex()
    i+=4
    #print('graceFee: '+str(graceFee))
    df = pd.DataFrame({'nftMint':nftMint.decode(), 'lotState':lotstate[int(str(lotState))], 'ticketsCount':ticketsCount }, index=[0])
    return df
    
def parseRaffleAccount(pub_key):
    #pub_key = "8X1TomsfTnbf61rPhqksYfmEtFkkt7KSq467Gm9EttmU"
    pk = PublicKey(pub_key)
    connection = Client("https://api.mainnet-beta.solana.com")
    #print(pk)
    result = json.loads(connection.get_account_info(pk, Confirmed, encoding="base64").to_json())
    #print(result)
    data = base64.b64decode(result['result']['value']['data'][0])
    #print(data)
    unpacked = unpack_raffleAccount(data)
    unpacked['raffleAccount'] = pub_key
    return unpacked
    
def parseLiquidationLot(pub_key):
    pk = PublicKey(pub_key)
    connection = Client("https://api.mainnet-beta.solana.com")
    #print(pk)
    result = json.loads(connection.get_account_info(pk, Confirmed, encoding="base64").to_json())
    #print(result)
    data = base64.b64decode(result['result']['value']['data'][0])
    #print(data)
    unpacked = unpack_LiquidationLot(data)
    unpacked['liquidationLot'] = pub_key
    return unpacked


if __name__ == "__main__":
    df = parseRaffleAccount("nic")
    print(df)
    """
    pk = PublicKey("DwQZXXtbN8azZmo8AEwrwXcr3zqyFaYr3SKCYMXf32fw")
    connection = Client("https://api.mainnet-beta.solana.com")    
    result = json.loads(connection.get_account_info(pk, Confirmed, encoding="base64").to_json())
    json_formatted_str = json.dumps(result, indent=2)
    print("RPC Response")
    print(json_formatted_str)
    print("")
    print("Extracted data")
    print(result['result']['value']['data'][0])
    
    f = open("parsedAccountData.txt", "w")
    f.write(result['result']['value']['data'][0])
    f.close()
    
    print("")
    print("Unpacked data")
    data = base64.b64decode(result['result']['value']['data'][0])
    metadata = unpack_LiquidationLot(data)
    """
