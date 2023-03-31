use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("8KwgsMuDE7HLLKFF22Hnt9ghJZWskQHbZTCmwwk3vzUi");

#[program]
pub mod escrow_headon_attempt {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, token_amount: u64) -> Result<()> {
        msg!("Assigning values.");
        // Get count of user escrow addresses and increment it
        let _counter = ctx.accounts.user_escrow_counter.counter;
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

        msg!("Transfering tokens to Escrow token account.");
        // Transfer token to Escrow Token Account
        /*
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.escrowed_tokens_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ), token_amount, )?;
        */
        msg!("The operation was successful");
        Ok(())
    }

    pub fn retrieve(ctx: Context<Retrieve>) -> Result<()> {
        // transfer escrowed tokens back to user
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),
             anchor_spl::token::Transfer {
                from: ctx.accounts.escrowed_tokens_token_account.to_account_info(),
                to: ctx.accounts.tokens_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
             },
             &[&["escrow".as_bytes(), ctx.accounts.escrow.authority.as_ref(), &[ctx.accounts.escrow.bump]]],
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
            &[&["escrow".as_bytes(), ctx.accounts.escrow.authority.as_ref(), &[ctx.accounts.escrow.bump]]],
        ))?;
        Ok(())
    }

    pub fn init_counter(ctx: Context<InitCounter>) -> Result<()> {
        let counter_account = &mut ctx.accounts.user_escrow_counter;
        counter_account.user = ctx.accounts.user.key();
        counter_account.counter = 0;
        counter_account.bump = *ctx.bumps.get("user_escrow_counter").unwrap();
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
    // Additional Program/Sysvar that are needed
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Retrieve<'info> {
    pub user: Signer<'info>,
    // PDA Escrow Data account (Reference)
    #[account(mut, seeds = ["escrow".as_bytes(), escrow.authority.as_ref(), user_escrow_counter.counter.to_le_bytes().as_ref()], bump = escrow.bump,)]
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
}

impl Escrow {
    pub const LEN: usize =
    8       // discriminator
    + 32    // authority: Pubkey
    + 1     // bump: u8
    + 32    // token_mint: Pubkey
    + 32    // escrowed_tokens_token_account: Pubkey
    + 8;    // token_amount: u64
}

#[account]
pub struct UserEscrowCounter {
    pub user: Pubkey,
    pub counter: u64,
    pub bump: u8,
}

impl UserEscrowCounter {
    pub const LEN: usize =
    8 // discriminator
    + 32 // user: Pubkey
    + 8 // counter: u64
    + 1; // bump: u8
}


#[error_code]
pub enum MyError {
    #[msg("TransferSuccessful")]
    TransferSuccessful
}
/*
if condition {
    return err!(MyError::TransferSuccessful);
}
 */

 #[error_code]
 pub enum CustomError {
     #[msg("Error: Provided user_token does not meet the constraints.")]
     InvalidUserToken,
 }