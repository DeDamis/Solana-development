use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instruction as mpl_instruction;

// Security issue: The authority of the NFT minting carries the user, so the user is able to mint the NFT within a different environment
// TODO: cleanup escrow data account?
declare_id!("557jTvF33E6y2rBk9rXVbLDtSepABhpdvNRm8JssSJKi");

#[program]
pub mod escrow_headon_attempt {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, token_amount: u64) -> Result<()> {
        msg!("Assigning values.");
        // Get count of user escrow addresses and increment it
        let _counter = ctx.accounts.user_escrow_counter.counter;
        ctx.accounts.user_escrow_counter.previous_counter = ctx.accounts.user_escrow_counter.counter;
        ctx.accounts.user_escrow_counter.counter += 1;
        // Init accounts
        let escrow = &mut ctx.accounts.escrow; // Escrow context account
        // Fetch bump from the seeds ["escrow"],
        // The Bump is the value the gets us from the ED25519 Eliptic Curve (so the PDA does not have Private Key)
        escrow.bump = *ctx.bumps.get("escrow").unwrap(); 
        escrow.authority = ctx.accounts.user.key(); // The user Public Key is stored
        escrow.escrowed_tokens_token_account = ctx.accounts.escrowed_tokens_token_account.key(); // Escrow Token Account Address
        escrow.token_amount = token_amount; // Save the amount deposited to escrow
        escrow.token_mint = ctx.accounts.token_mint.key(); // Token Mint Address
        escrow.nft_mint = ctx.accounts.nft_mint.key(); // Save NFT Mint Address
        escrow.nft_acquired = false;

        msg!("Transfering tokens to Escrow token account.");
        // Transfer token to Escrow Token Account
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.escrowed_tokens_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ), token_amount)?;
        msg!("The transfer was successful");
        Ok(())
    }

    pub fn retrieve(ctx: Context<Retrieve>) -> Result<()> {
        // burn the NFT
        anchor_spl::token::burn(
            CpiContext::new(ctx.accounts.token_program.to_account_info(),
             anchor_spl::token::Burn {
                mint: ctx.accounts.nft_mint.to_account_info(),
                from: ctx.accounts.user_nft_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(), 
             },),
            1, // one NFT
        )?;
        // transfer escrowed tokens back to user
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),
             anchor_spl::token::Transfer {
                from: ctx.accounts.escrowed_tokens_token_account.to_account_info(),
                to: ctx.accounts.tokens_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
             },
             &[&["escrow".as_bytes(), ctx.accounts.user.key().as_ref(), ctx.accounts.user_escrow_counter.previous_counter.to_le_bytes().as_ref() , &[ctx.accounts.escrow.bump]]],
            ),
            ctx.accounts.escrowed_tokens_token_account.amount,
        )?;
        anchor_spl::token::close_account(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::CloseAccount {
                account: ctx.accounts.escrowed_tokens_token_account.to_account_info(),
                destination: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            &[&["escrow".as_bytes(), ctx.accounts.user.key().as_ref(), ctx.accounts.user_escrow_counter.previous_counter.to_le_bytes().as_ref() , &[ctx.accounts.escrow.bump]]],
        ))?;
        Ok(())
    }

    pub fn init_counter(ctx: Context<InitCounter>) -> Result<()> {
        let counter_account = &mut ctx.accounts.user_escrow_counter;
        counter_account.user = ctx.accounts.user.key();
        counter_account.counter = 0;
        counter_account.previous_counter = 0;
        counter_account.bump = *ctx.bumps.get("user_escrow_counter").unwrap();
        Ok(())
    }

    pub fn get_nft(ctx: Context<GetNFT>) -> Result<()> {
        assert!(ctx.accounts.escrow.nft_acquired == false, "NFT already acquired!");
        // Mint the NFT to the user's wallet
        msg!("Minting a NFT to associated token account...");
        let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::MintTo{
            mint: ctx.accounts.nft_mint.to_account_info(),
            to: ctx.accounts.user_nft_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },);
        anchor_spl::token::mint_to(cpi_context, 1)?;
        ctx.accounts.escrow.nft_acquired = true;
        Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    user: Signer<'info>,
    token_mint: Account<'info, Mint>,
    // Mutable reference to the User Token Account (that already existed)
    #[account(mut, constraint = user_token.mint == token_mint.key() && user_token.owner == user.key() || return err!(CustomError::InvalidUserToken))]
    user_token: Account<'info, TokenAccount>,
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
    escrowed_tokens_token_account: Account<'info, TokenAccount>,
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
pub struct Retrieve<'info> {
    pub user: Signer<'info>,
    #[account(mut, constraint = nft_mint.key() == escrow.nft_mint)]
    pub nft_mint: Account<'info, Mint>,
    #[account(mut, constraint = user_nft_token_account.mint == escrow.nft_mint)]
    pub user_nft_token_account: Account<'info, TokenAccount>,
    // PDA Escrow Data account (Reference)
    #[account(mut, seeds = ["escrow".as_bytes(), escrow.authority.as_ref(), user_escrow_counter.previous_counter.to_le_bytes().as_ref()], bump = escrow.bump,)]
    pub escrow: Account<'info, Escrow>,
    // Mutable reference to the User Escrow Addresses counter
    #[account(mut, seeds = [b"counter", user.key().as_ref()], bump = user_escrow_counter.bump)]
    pub user_escrow_counter: Account<'info, UserEscrowCounter>,
    // Escrow Token account (Reference)
    #[account(mut, constraint = escrowed_tokens_token_account.key() == escrow.escrowed_tokens_token_account)]
    pub escrowed_tokens_token_account: Account <'info, TokenAccount>,
    // Reference to the recipient token account
    #[account(mut, constraint = tokens_token_account.mint == escrow.token_mint)]
    tokens_token_account: Account<'info, TokenAccount>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetNFT<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = nft_mint.key() == escrow.nft_mint)]
    pub nft_mint: Account<'info, Mint>,
    //#[account(mut)]
    //pub metadata_account: UncheckedAccount<'info>,
    #[account(mut, seeds = ["escrow".as_bytes(), escrow.authority.as_ref(), user_escrow_counter.previous_counter.to_le_bytes().as_ref()], bump = escrow.bump,)]
    pub escrow: Account<'info, Escrow>,
    // Mutable reference to the User Escrow Addresses counter
    #[account(mut, seeds = [b"counter", user.key().as_ref()], bump = user_escrow_counter.bump)]
    pub user_escrow_counter: Account<'info, UserEscrowCounter>,
    //#[account(mut, constraint = user_nft_token_account.mint == nft_mint.key() && user_nft_token_account.owner == user.key() || return err!(CustomError::InvalidUserToken))]
    //#[account(init, payer = user, token::mint = nft_mint, token::authority = user,)]
    #[account(init, payer = user, associated_token::mint = nft_mint, associated_token::authority = user,)]
    pub user_nft_token_account: Account<'info, TokenAccount>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct InitCounter<'info> {
    #[account(mut)]
    user: Signer<'info>,
    // PDA (=Program Derived Address) of seeds ["counter", user.PK]
    #[account(init, payer = user, space = UserEscrowCounter::LEN, seeds = [b"counter", user.key().as_ref()], bump)]
    pub user_escrow_counter: Account<'info, UserEscrowCounter>,
    system_program: Program<'info, System>,
}

#[account]
pub struct Escrow {
    authority: Pubkey,
    bump: u8,
    token_mint: Pubkey,
    escrowed_tokens_token_account: Pubkey,
    token_amount: u64,
    nft_mint: Pubkey,
    nft_acquired: bool,
}

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

#[account]
pub struct UserEscrowCounter {
    pub user: Pubkey,
    pub counter: u64,
    pub previous_counter: u64,
    pub bump: u8,
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
pub enum MyError {
    #[msg("TransferSuccessful")]
    TransferSuccessful
}

 #[error_code]
 pub enum CustomError {
     #[msg("Error: Provided user_token does not meet the constraints.")]
     InvalidUserToken,
 }

 /*
if condition {
    return err!(MyError::TransferSuccessful);
}
 */