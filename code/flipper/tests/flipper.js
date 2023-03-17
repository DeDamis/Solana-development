const anchor = require("@coral-xyz/anchor");
const assert = require("assert");
const {SystemProgram} = anchor.web3;

describe("flipper", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Flipper;

  it("Creates a Flip Account", async () => {
    // Add your test here.
    const switchAccount = anchor.web3.Keypair.generate();
    await program.methods.initialize().accounts({
      switchAccount: switchAccount.publicKey,
      user: provider.wallet.publicKey,
      system_program: SystemProgram.programId
    })
    .signers([switchAccount])
    .rpc();
    const baseAccount = await program.account.switchAccount.fetch(switchAccount.publicKey);
    assert.ok(baseAccount.state);
    _baseAccount = switchAccount;
  });

  it('Flip the switch', async()=>{
    baseAccount = _baseAccount;
    await program.methods.flip().accounts({
      switchAccount: baseAccount.publicKey
    }).rpc();
    const account = await program.account.switchAccount.fetch(baseAccount.publicKey);
    assert.ok(account.state == false);
  })

});
