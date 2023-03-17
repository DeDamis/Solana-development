import './App.css';
import {useState} from 'react';
import {Connection, PublicKey} from '@solana/web3.js';
import {Program, AnchorProvider, web3} from '@coral-xyz/anchor';
import idl from './idl.json';
import {PhantomWalletAdapter, SolflareWalletAdapter} from '@solana/wallet-adapter-wallets';
import {useWallet, WalletProvider, ConnectionProvider} from '@solana/wallet-adapter-react';
import {WalletModalProvider, WalletMultiButton} from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
];

const {Keypair, SystemProgram} = web3;
const switchAccount = Keypair.generate();
const programId = new PublicKey(idl.metadata.address);
const opts = {
  preflightCommitment: "Processed"
}

function App() {
  const [value, setValue] = useState(null);
  const wallet = useWallet();
  async function getProvider() {
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(connection, wallet, opts.preflightCommitment)
    return provider;
  }

  async function initialize() {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);
    try {
      await program.methods.initialize().accounts({
        switchAccount: switchAccount.PublicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([switchAccount])
      .rpc();
      const account = await program.account.switchAccount.fetch(switchAccount.publicKey);
      setValue(account.state.toString())
    } catch (err) {
      console.log(err);
    }
  }
  
  async function flip(){
    const provider = getProvider();
    const program = new Program(idl, programId, provider);
    await program.methods.flip().accounts({
      switchAccount: switchAccount.publicKey,
    })
    .rpc();
    const account = await program.account.switchAccount.fetch(switchAccount.publicKey);
    setValue(account.state.toString())
  }


  if (!wallet.connected){
    return(
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
      <WalletMultiButton />
      </div>
    )
  }
  else {
    return(
      <div className="App">
        <div>
          {
            !value && (<button onClick={initialize}>Create a switch</button>)
          }
          {
            value && <button onClick={flip}>Flip the Switch</button>
          }

          {
            value ? (
              <h2>{value}</h2>
            ) : (
              <h3>Please create the switch.</h3>
            )
          }
        </div>
      </div>
    )
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;
