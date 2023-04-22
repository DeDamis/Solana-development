  File: README.md
  Author: xsmehy00
  Summary:
    This Solana program, created using the Anchor framework, is an escrow application (sometimes referred to as "The deposit box.").
    There is backend in Rust, file lib.rs located in the programs/escrow/src
    There is a frontend in React, located in the app folder

How to get up & running

prerequisites

Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

node (installation is distro dependent)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install node

npm
sudo apt install npm

yarn
sudo npm i -g yarn

solana cli
latest version here -> https://docs.solana.com/cli/install-solana-cli-tools
sh -c "$(curl -sSfL https://release.solana.com/v1.15.2/install)"

anchor via avm (anchor version manager)
sudo apt-get update && sudo apt-get upgrade && sudo apt-get install -y pkg-config build-essential libudev-dev libssl-dev
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

cargo
sudo apt install cargo

setting things up

start up local validator node
  solana-keygen new
  solana config set --url http://127.0.0.1:8899
  solana-test-validator

create, prepare, build anchor project
    anchor init <name>
 example:   anchor init escrow
 cd escrow
 anchor build
 -- copy ./escrow/programs/escrow folder with its contents to your project
 -- copy ./escrow/Anchor.toml to your project
 -- copy ./package.json to your project
 yarn install
 anchor build
 anchor deploy
 -- copy "Program Id" to Anchor.toml and lib.rs
 anchor build
 anchor deploy

 frontend
 cd escrow
 npx create-react-app app
-- copy ./escrow/app/package.json to your project
cd app
npm install
-- copy ./escrow/app/src folder to your project
-- set correct "Program Id" in the idl.json file 
npm start

Tested versions:
rustc 1.69.0
npm 8.5.1
yarn v1.22.19
solana-cli v1.15.2
avm 0.27.0
anchor-cli 0.27.0
Node.js v20.0.0.