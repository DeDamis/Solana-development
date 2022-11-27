import base64
import base58
import struct
import json
from solana.rpc.commitment import Confirmed
from solana.publickey import PublicKey
from solana.rpc.api import Client

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

def unpack_LiquidationLot(data):
    # start index
    i = 8
    loan = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    print('loan: '+str(loan))
    i += 32
    nftMint = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    print('nftMint: '+str(nftMint))
    i += 32
    vaultNftTokenAccount = base58.b58encode(bytes(struct.unpack('<' + "B"*32, data[i:i+32])))
    print('vaultNftTokenAccount: '+str(vaultNftTokenAccount))
    i += 32
    lotNoFeesPrice = data[i:i+5]
    lotNoFeesPrice = lotNoFeesPrice[::-1]
    lotNoFeesPrice = lotNoFeesPrice.hex()
    i+=8
    print('lotNoFeesPrice: '+str(lotNoFeesPrice))
    winningChanceInBasePoints = data[i:i+1]
    winningChanceInBasePoints = winningChanceInBasePoints[::-1]
    winningChanceInBasePoints = winningChanceInBasePoints.hex()
    i+=8
    print('winningChanceInBasePoints: '+str(winningChanceInBasePoints))
    startedAt = data[i:i+4]
    startedAt = startedAt[::-1]
    startedAt = startedAt.hex()
    i+=8
    print('startedAt: '+str(startedAt))
    endingAt = data[i:i+4]
    endingAt = endingAt[::-1]
    endingAt = endingAt.hex()
    i+=8
    print('endingAt: '+str(endingAt))
    lotState = data[i:i+1]
    lotState = lotState[::-1]
    lotState = lotState.hex()
    i+=12
    print('lotState: '+str(lotState))
    # lotstate:
    #    0 : not active
    #    1 : active
    #    2 : redeemed
    #    3 : paid back
    #idk
    ticketsCount = data[i:i+1]
    ticketsCount = ticketsCount[::-1]
    ticketsCount = ticketsCount.hex()
    i+=1
    print('ticketsCount: '+str(ticketsCount))
    gracePeriod = data[i:i+3]
    gracePeriod = gracePeriod[::-1]
    gracePeriod = gracePeriod.hex()
    i+=8
    print('gracePeriod: '+str(gracePeriod))
    graceFee = data[i:i+2]
    graceFee = graceFee[::-1]
    graceFee = graceFee.hex()
    i+=4
    print('graceFee: '+str(graceFee))

if __name__ == "__main__":
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
