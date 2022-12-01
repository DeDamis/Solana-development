"""
print("Hello async main()")
public_key = PublicKey("A66HabVL3DzNzeJgcHYtRRNW1ZRMKwBfrdSR4kLsZ9DJ")
connection = AsyncClient("https://api.mainnet-beta.solana.com", Confirmed)
print("Connecting...")
await connection.is_connected()
print("Connected.")
"""