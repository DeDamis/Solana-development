import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { EscrowHeadonAttempt } from "../target/types/escrow_headon_attempt";
import { LAMPORTS_PER_SOL, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";


describe("EscrowHeadOnAttempt", () => {
  const provider =  anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.EscrowHeadonAttempt as Program<EscrowHeadonAttempt>;
  
  const user =  anchor.web3.Keypair.generate();
  const payer = (provider.wallet as NodeWallet).payer;
  const escrowTAKeypair = anchor.web3.Keypair.generate();
  let token_mint;
  let user_token_account;
  let escrow: anchor.web3.PublicKey;
  
  before(async() => {
    //await provider.connection.requestAirdrop(buyer.publicKey, 1*LAMPORTS_PER_SOL);
    // Derive escrow address
    [escrow] = await anchor.web3.PublicKey.findProgramAddress([
      anchor.utils.bytes.utf8.encode("escrow"),
      user.publicKey.toBuffer()
    ], 
    program.programId)

    token_mint = await splToken.Token.createMint(
      provider.connection,
      payer,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      6,
      splToken.TOKEN_PROGRAM_ID
    );


    user_token_account = await token_mint.createAccount(user);
    await token_mint.mintTo(user_token_account, payer, [], 10_000_000_000);

  })

  // idk
  it("Initialize escrow", async () => {
    const token_amount = new anchor.BN(40);
    const tx = await program.methods.initialize(token_amount)
      .accounts({
        user: user.publicKey,
        tokenMint: token_mint.publicKey,
        userToken: user_token_account,
        escrow: escrow,
        escrowedTokensTokenAccount: escrowTAKeypair.publicKey,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([escrowTAKeypair])
      .rpc()
  });

  // not there yet
  it("Execute the trade", async () => { 
    const tx = await program.methods.retrieve()
      .accounts({
        user: user.publicKey,
        escrow: escrow,
        escrowedTokensTokenAccount: escrowTAKeypair.publicKey,
        tokensTokenAccount: user_token_account,
        tokenProgram: splToken.TOKEN_PROGRAM_ID
      })
      .signers([user])
      .rpc()
  });

});