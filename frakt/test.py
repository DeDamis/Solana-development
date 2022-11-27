import base64
import base58
import struct
import json
import asyncio
from solana.rpc.commitment import Confirmed
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.types import MemcmpOpts

async def main():
    print("Hello async main()")
    public_key = PublicKey("A66HabVL3DzNzeJgcHYtRRNW1ZRMKwBfrdSR4kLsZ9DJ")
    connection = AsyncClient("https://api.mainnet-beta.solana.com", Confirmed)
    print("Connecting...")
    await connection.is_connected()
    print("Connected.")

if __name__ == "__main__":
    asyncio.run(main())