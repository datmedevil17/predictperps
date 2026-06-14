use anchor_lang::prelude::*;

use crate::constants::MARKET_SEED;
use crate::state::Market;

pub fn handle_create_market(
    ctx: Context<CreateMarket>,
    market_id: u64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    market.admin = ctx.accounts.admin.key();
    market.market_id = market_id;
    market.bump = ctx.bumps.market;
    Ok(())
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = Market::LEN,
        seeds = [MARKET_SEED, market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    pub system_program: Program<'info, System>,
}
