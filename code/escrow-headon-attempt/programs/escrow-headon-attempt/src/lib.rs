use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod escrow_headon_attempt {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, token_amount: u64) -> Result<()> {
        // Init accounts
        let escrow = &mut ctx.accounts.escrow; // Escrow context account
        // Fetch bump from the seeds ["escrow"],
        // The Bump is the value the gets us from the ED25519 Eliptic Curve (so the PDA does not have Private Key)
        escrow.bump = *ctx.bumps.get("escrow").unwrap(); 
        escrow.authority = ctx.accounts.user.key(); // The user Public Key is stored
        escrow.escrowed_tokens_token_account = ctx.accounts.escrowed_tokens_token_account.key(); // Escrow Token Account Address
        escrow.token_amount = token_amount; // Save the amount deposited to escrow
        escrow.token_mint = ctx.accounts.token_mint.key(); // Token Mint Address


        // Transfer token to Escrow Token Account
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.user_token.to_account_info(),
                    to: ctx.accounts.escrowed_tokens_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ), token_amount, )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    user: Signer<'info>,
    token_mint: Account<'info, Mint>,
    // Mutable reference to the User Token Account (that already existed)
    #[account(mut, constraint = user_token.mint == token_mint.key() && user_token.owner == user.key())]
    user_token: Account<'info, TokenAccount>,
    // PDA (=Program Derived Address) of seeds ["escros", user.PK]
    #[account(init, payer = user, space = Escrow::LEN, seeds = ["escrow".as_bytes(), user.key().as_ref()], bump,)]
    pub escrow: Account<'info, Escrow>,
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
    + 8;    // token_amount: u64
}