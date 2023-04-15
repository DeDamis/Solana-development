use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

// TODO: cleanup escrow data account?
// As of 15. 04. 2023, this program does not delete data accounts (escrow, token metadata and the escrow counter) after asset retrieval

declare_id!("8KwgsMuDE7HLLKFF22Hnt9ghJZWskQHbZTCmwwk3vzUi");

#[program]
pub mod escrow_headon_attempt {
    use super::*;

    // the ordering of the following procedures (functions) in this source code is simillar
    // to the expected application workflow (counter initialization, escrow deposit, nft reception and at last asset retrieval)

    pub fn init_counter(ctx: Context<InitCounter>) -> Result<()> {
        let counter_account = &mut ctx.accounts.user_escrow_counter;
        counter_account.user = ctx.accounts.user.key();
        counter_account.counter = 0;
        counter_account.previous_counter = 0;
        counter_account.bump = *ctx.bumps.get("user_escrow_counter").unwrap();
        Ok(())
    }

    pub fn initialize_token_escrow(ctx: Context<InitializeTokenEscrow>, token_amount: u64) -> Result<()> {
        msg!("Updating user's escrow counter.");
        let user_escrow_counter = & mut ctx.accounts.user_escrow_counter;
        user_escrow_counter.previous_counter = user_escrow_counter.counter;
        user_escrow_counter.counter += 1;

        msg!("Initializing the escrow data account.");
        let user = & ctx.accounts.user;
        let escrow = &mut ctx.accounts.escrow;
        let user_token_ata = & ctx.accounts.user_token_ata;
        let escrow_token_ata = & ctx.accounts.escrow_token_ata;
        let token_mint = & ctx.accounts.token_mint;
        let nft_mint = & ctx.accounts.nft_mint; 
        msg!("Escrow data account {}", escrow.key());
        // Fetch bump from the seeds of ["escrow"],
        // The Bump is the value the gets us from the ED25519 Eliptic Curve (so the PDA does not have Private Key)
        escrow.bump = *ctx.bumps.get("escrow").unwrap(); 
        escrow.authority = user.key(); // The user's Public Key is stored
        escrow.escrow_token_ata = escrow_token_ata.key(); // Escrow Token Account Address
        escrow.token_amount = token_amount; // Save the amount deposited to escrow
        escrow.token_mint = token_mint.key(); // Token Mint Address
        escrow.nft_mint = nft_mint.key(); // Save NFT Mint Address
        escrow.nft_acquired = false;

        msg!("Transfering tokens to escrow's token account.");
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: user_token_ata.to_account_info(),
                    to: escrow_token_ata.to_account_info(),
                    authority: user.to_account_info(),
                },
            ), token_amount)?;
        msg!("The transfer was successful.");
        msg!("Please proceed with NFT retrieval.");
        Ok(())
    }

    pub fn initialize_sol_escrow(_ctx: Context<InitializeSol>, _token_amount: u64) -> Result<()> {
        Ok(())
    }

    pub fn get_nft(ctx: Context<GetNFT>) -> Result<()> {
        assert!(ctx.accounts.escrow.nft_acquired == false, "NFT already acquired!");

        // Get account references (improves readability later)
        let escrow = &mut ctx.accounts.escrow;
        let user_escrow_counter = &ctx.accounts.user_escrow_counter;
        let metadata_account = &mut ctx.accounts.metadata_account;

        // Set NFT metadata
        metadata_account.bump = *ctx.bumps.get("metadata_account").unwrap();
        metadata_account.token_title = String::from("Deposit Box Key");
        metadata_account.escrow_number = user_escrow_counter.previous_counter;
        metadata_account.escrowed_token_mint = escrow.token_mint;
        metadata_account.escrowed_amount = escrow.token_amount;

        msg!("escrow account: {}", escrow.key());
        msg!("NFT mint key: {}", ctx.accounts.nft_mint.key());
        msg!("Metadata account address: {}", metadata_account.key());

        // Mint the NFT to the user's wallet
        msg!("Minting a NFT to user's associated token account...");
        let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::MintTo{
            mint: ctx.accounts.nft_mint.to_account_info(),
            to: ctx.accounts.user_nft_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },);
        anchor_spl::token::mint_to(cpi_context, 1)?;
        msg!("Minting was successful.");
        // Toggle nft_acquired flag in the escrow account
        escrow.nft_acquired = true;
        Ok(())
    }

    pub fn retrieve(ctx: Context<Retrieve>) -> Result<()> {
        let user = & ctx.accounts.user;
        let escrow = & ctx.accounts.escrow;
        let metadata_account = & ctx.accounts.metadata_account;
        let user_nft_ata = & ctx.accounts.user_nft_ata;
        let nft_mint = & ctx.accounts.nft_mint;
        let escrow_token_ata = & ctx.accounts.escrow_token_ata;
        let user_token_ata = & ctx.accounts.user_token_ata;

        // burn the NFT
        anchor_spl::token::burn(
            CpiContext::new(ctx.accounts.token_program.to_account_info(),
             anchor_spl::token::Burn {
                mint: nft_mint.to_account_info(),
                from: user_nft_ata.to_account_info(),
                authority: user.to_account_info(), 
             },),
            1, // one NFT
        )?;
        // transfer escrowed tokens back to user
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),
             anchor_spl::token::Transfer {
                from: escrow_token_ata.to_account_info(),
                to: user_token_ata.to_account_info(),
                authority: escrow.to_account_info(),
             },
             &[&["escrow".as_bytes(), ctx.accounts.user.key().as_ref(), metadata_account.escrow_number.to_le_bytes().as_ref(), &[ctx.accounts.escrow.bump]]],
            ),
            escrow.token_amount
        )?;
        anchor_spl::token::close_account(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::CloseAccount {
                account: escrow_token_ata.to_account_info(),
                destination: user.to_account_info(),
                authority: escrow.to_account_info(),
            },
            &[&["escrow".as_bytes(), ctx.accounts.user.key().as_ref(), metadata_account.escrow_number.to_le_bytes().as_ref(), &[ctx.accounts.escrow.bump]]],
        ))?;
        Ok(())
    }
}

// Context (de)serialization structures

#[derive(Accounts)]
pub struct InitCounter<'info> {
    #[account(mut)]
    user: Signer<'info>,
    // PDA (=Program Derived Address) of seeds ["counter", user.PK]
    #[account(init, payer = user, space = UserEscrowCounter::LEN, seeds = [b"counter", user.key().as_ref()], bump)]
    pub user_escrow_counter: Account<'info, UserEscrowCounter>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeTokenEscrow<'info> {
    #[account(mut)]
    user: Signer<'info>,
    token_mint: Account<'info, Mint>,
    // Mutable reference to the User Token Account (that already existed)
    #[account(mut, constraint = user_token_ata.mint == token_mint.key() && user_token_ata.owner == user.key() || return err!(CustomError::InvalidUserToken))]
    user_token_ata: Account<'info, TokenAccount>,
    #[account(init, payer = user, mint::decimals = 0, mint::authority = user, mint::freeze_authority = user)]
    nft_mint: Account<'info, Mint>,
    // PDA (=Program Derived Address) of seeds ["escrow", user.PK]
    #[account(init, payer = user, space = Escrow::LEN, seeds = ["escrow".as_bytes(), user.key().as_ref(), user_escrow_counter.counter.to_le_bytes().as_ref()], bump,)]
    pub escrow: Account<'info, Escrow>,
    // Mutable reference to the User Escrow Addresses counter
    #[account(mut, seeds = [b"counter", user.key().as_ref()], bump = user_escrow_counter.bump)]
    pub user_escrow_counter: Account<'info, UserEscrowCounter>,
    // Newly created token account for storing the tokens
    // The owner of the token account is the Token Program
    // The authority is the PDA (account)
    #[account(init, payer = user, token::mint = token_mint, token::authority = escrow,)]
    escrow_token_ata: Account<'info, TokenAccount>,
    //#[account(mut, constraint = user_nft_token_account.mint == nft_mint.key() && user_nft_token_account.owner == user.key() || return err!(CustomError::InvalidUserToken))]
    //#[account(init, payer = user, token::mint = token_mint, token::authority = user,)]
    //user_nft_token_account: Account<'info, TokenAccount>,
    // Additional Program/Sysvar that are needed
    token_program: Program<'info, Token>,
    //associated_token_program: Program<'info, AssociatedToken>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeSol<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(init, payer = user, mint::decimals = 0, mint::authority = user, mint::freeze_authority = user)]
    nft_mint: Account<'info, Mint>,
    // PDA (=Program Derived Address) of seeds ["escrow", user.PK]
    #[account(init, payer = user, space = Escrow::LEN, seeds = ["escrow".as_bytes(), user.key().as_ref(), user_escrow_counter.counter.to_le_bytes().as_ref()], bump,)]
    pub escrow: Account<'info, Escrow>,
    // Mutable reference to the User Escrow Addresses counter
    #[account(mut, seeds = [b"counter", user.key().as_ref()], bump = user_escrow_counter.bump)]
    pub user_escrow_counter: Account<'info, UserEscrowCounter>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetNFT<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = nft_mint.key() == escrow.nft_mint)]
    pub nft_mint: Account<'info, Mint>,
    // PDA (=Program Derived Address) of seeds ["counter", user.PK]
    #[account(init, payer = user, space = TokenMetadata::LEN, seeds = [b"metadata", nft_mint.key().as_ref()], bump)]
    pub metadata_account: Account<'info, TokenMetadata>,
    #[account(mut, seeds = ["escrow".as_bytes(), escrow.authority.as_ref(), user_escrow_counter.previous_counter.to_le_bytes().as_ref()], bump = escrow.bump,)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, seeds = [b"counter", user.key().as_ref()], bump = user_escrow_counter.bump)]
    pub user_escrow_counter: Account<'info, UserEscrowCounter>,
    #[account(init, payer = user, associated_token::mint = nft_mint, associated_token::authority = user,)]
    pub user_nft_token_account: Account<'info, TokenAccount>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct Retrieve<'info> {
    pub user: Signer<'info>,
    #[account(mut, constraint = nft_mint.key() == escrow.nft_mint)]
    pub nft_mint: Account<'info, Mint>, 
    #[account(mut, seeds= [b"metadata", nft_mint.key().as_ref()], bump = metadata_account.bump)]
    pub metadata_account: Account<'info, TokenMetadata>,
    #[account(mut, seeds = [b"escrow", escrow.authority.as_ref(), metadata_account.escrow_number.to_le_bytes().as_ref()], bump = escrow.bump,)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, constraint = user_nft_ata.mint == escrow.nft_mint)]
    pub user_nft_ata: Account<'info, TokenAccount>,
    #[account(mut, constraint = escrow_token_ata.key() == escrow.escrow_token_ata)]
    pub escrow_token_ata: Account <'info, TokenAccount>,
    #[account(mut, constraint = user_token_ata.mint == escrow.token_mint)]
    pub user_token_ata: Account<'info, TokenAccount>,
    token_program: Program<'info, Token>,
}

// Data structures

#[account]
pub struct Escrow {
    authority: Pubkey,
    bump: u8,
    token_mint: Pubkey,
    escrow_token_ata: Pubkey,
    token_amount: u64,
    nft_mint: Pubkey,
    nft_acquired: bool,
}

#[account]
pub struct TokenMetadata {
    pub token_title: String,
    pub escrow_number: u64,
    pub escrowed_token_mint: Pubkey,
    pub escrowed_amount: u64,
    pub bump: u8,
}

#[account]
pub struct UserEscrowCounter {
    pub user: Pubkey,
    pub counter: u64,
    pub previous_counter: u64,
    pub bump: u8,
}


// Data structures sizing

impl Escrow {
    pub const LEN: usize =
    8       // discriminator
    + 32    // authority: Pubkey
    + 1     // bump: u8
    + 32    // token_mint: Pubkey
    + 32    // escrowed_tokens_token_account: Pubkey
    + 8     // token_amount: u64
    + 32    // nft_mint: Pubkey
    + 1;    // nft_acquired: bool
}

impl TokenMetadata {
    pub const LEN: usize =
    8       // discriminator
    + 100   // token_title: String (limited to "100" characters)
    + 8     // escrow_number: u64
    + 32    // escrowed_token_mint: Pubkey
    + 8     // escrowed_amount: u64
    + 8;    // bump: u64
}

impl UserEscrowCounter {
    pub const LEN: usize =
    8 // discriminator
    + 32 // user: Pubkey
    + 8 // counter: u64
    + 8 // previous_counter: u64
    + 1; // bump: u8
}

#[error_code]
pub enum CustomError {
    #[msg("Error: Provided user_token does not meet the constraints.")]
    InvalidUserToken,
}

/*
-----ARCHIVE-----
Metaplex token metadata account
 - I have explored the possibility of using the standardized metadata account for storing the NFT metadata,
   however I have found it added an extra unneccessary tidious work that would slow down the development pace
[imports]
    use anchor_lang::solana_program::program::invoke;
    use mpl_token_metadata::{ID as TOKEN_METADATA_ID, instruction as mpl_instruction};
[context structures]
    #[derive(Accounts)]
    pub struct GetNFT<'info> {
        /// rest of the code
        /// CHECK: This account does not exist and will be created just now
        #[account(mut)]
        pub metadata_account: UncheckedAccount<'info>,
        /// CHECK: Metaplex will check this
        token_metadata_program: UncheckedAccount<'info>,
        rent: Sysvar<'info, Rent>,
    }
 [procedure impl]
    let token_symbol = String::from("BKEY");
    let token_uri = String::from("");
    msg!("Creating metadata account...");
    msg!("Metadata account address: {}", &ctx.accounts.metadata_account.key());
    invoke(
        &mpl_instruction::create_metadata_accounts_v3(
            TOKEN_METADATA_ID,                              // Program ID (the Token Metadata Program)
            ctx.accounts.metadata_account.key(),            // Metadata account
            ctx.accounts.nft_mint.key(),                    // Mint account
            ctx.accounts.user.key(),                        // Mint authority
            ctx.accounts.user.key(),                        // Payer
            ctx.accounts.user.key(),                        // Update authority
            token_title,                                    // Name
            token_symbol,                                   // Symbol
            token_uri,                                      // URI
            None,                                           // Creators
            0,                                              // Seller fee basis points
            true,                                           // Update authority is signer
            false,                                          // Is mutable
            None,                                           // Collection
            None,                                           // Uses
            None,                                           // Collection Details
        ),
        &[
            ctx.accounts.metadata_account.to_account_info(),
            ctx.accounts.nft_mint.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ]
    )?;
    msg!("Metadata account created successfully.");
*/

/*
-----TEMPLATES-----
if condition {
    return err!(MyError::TransferSuccessful);
}

#[error_code]
pub enum MyError {
    #[msg("TransferSuccessful")]
    TransferSuccessful
}

 */