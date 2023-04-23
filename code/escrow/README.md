# Escrow Application with Solana and Anchor

This Solana program, created using the Anchor framework, is an escrow application (sometimes referred to as "The deposit box"). It features a Rust backend (located in the `programs/escrow/src` directory) and a React frontend (located in the `app` folder).

Author: xsmehy00

## Prerequisites

Make sure to have the following utilities installed on your system:

- **Rust**: Install Rust by running:

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

- **Node.js**: Install Node.js using the Node Version Manager (nvm):
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install node
```

- **npm**: Install npm using the package manager for your distribution. For example, on Ubuntu:
```
sudo apt install npm
```

- **Yarn**: Install Yarn globally:

```
sudo npm i -g yarn
```


- **Solana CLI**: Install the Solana CLI by following the [official instructions](https://docs.solana.com/cli/install-solana-cli-tools) or using the script below:

```
sh -c "$(curl -sSfL https://release.solana.com/v1.15.2/install)"
```

- **Anchor CLI**: Install Anchor CLI via AVM (Anchor Version Manager):

```
sudo apt-get update && sudo apt-get upgrade && sudo apt-get install -y pkg-config build-essential libudev-dev libssl-dev
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

- **Cargo**: Install Cargo using the package manager for your distribution. For example, on Ubuntu:

```
sudo apt install cargo
```

## Setting Things Up

1. Start up a local validator node:

```
solana-keygen new
solana config set --url http://127.0.0.1:8899
solana-test-validator
```

2. Create, prepare, and build the Anchor project:
```
anchor init <name>
```
For example:
```
anchor init escrow
cd escrow
anchor build
```
Copy the `~/escrow/programs/escrow` folder with its contents to your project. Also, copy `~/escrow/Anchor.toml` and `~/escrow/package.json` to your project. Then run:
```
yarn install
anchor build
anchor deploy
```
Copy the "Program Id" to `Anchor.toml` and `lib.rs`. Finally, run:

```
anchor build
anchor deploy
```

3. Set up the frontend:

```
cd escrow
npx create-react-app app
```
Copy `~/escrow/app/package.json` to your project. Then run:

```
cd app
npm install
```
Copy the `~/escrow/app/src` folder to your project, replacing the existing `src` folder.
With the same "Program Id" you deployed the program with, replace the metadata.address (at the end of the file)in the `idl.json` file. 
Finally, run:

```
npm start
```

## Tested Versions

- rustc 1.69.0
- npm 8.5.1
- yarn v1.22.19
- solana-cli v1.15.2
- avm 0.27.0
- anchor-cli 0.27.0
- Node.js v20.0.0