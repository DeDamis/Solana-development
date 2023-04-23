import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { EscrowHeadonAttempt } from "../target/types/escrow_headon_attempt";
import { LAMPORTS_PER_SOL, SYSVAR_RENT_PUBKEY} from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { token } from "@coral-xyz/anchor/dist/cjs/utils";


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
    await provider.connection.requestAirdrop(user.publicKey, 1 * LAMPORTS_PER_SOL);
    // Derive escrow address
    [escrow] = await anchor.web3.PublicKey.findProgramAddress([
      anchor.utils.bytes.utf8.encode("escrow"),
      user.publicKey.toBuffer()
    ], 
    program.programId)

    token_mint = await splToken.createMint(
      provider.connection,
      payer,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      6
    );


    user_token_account = await splToken.createAssociatedTokenAccount(
      provider.connection,
      payer,
      token_mint,      // mint address
      user.publicKey, // owner
      );

    await splToken.mintTo(
      provider.connection,
      payer,
      token_mint,
      user_token_account,
      payer,
      10_000_000_000);

  })

  // idk
  it("Initialize escrow", async () => {
    const token_amount = new anchor.BN(40);
    const tx = await program.methods.initialize(token_amount)
      .accounts({
        user: user.publicKey,
        tokenMint: token_mint,
        userToken: user_token_account,
        escrow: escrow,
        escrowedTokensTokenAccount: escrowTAKeypair.publicKey,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([user, escrowTAKeypair]) // I added the user Keypair as a signer
      .rpc()
  });

  // not there yet
  it("Retrieve from Escrow", async () => { 
    const tx = await program.methods.retrieve()
      .accounts({
        user: user.publicKey,
        escrow: escrow,
        escrowedTokensTokenAccount: escrowTAKeypair.publicKey,
        tokensTokenAccount: user_token_account,
        tokenProgram: splToken.TOKEN_PROGRAM_ID
      })
      .signers([user]) // I added the user Keypair as a signer
      .rpc()
  });

});