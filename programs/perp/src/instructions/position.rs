use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

use crate::constants::POSITION_SEED;
use crate::error::ErrorCode;
use crate::state::{Market, Position};

pub fn handle_open_position(ctx: Context<OpenPosition>, is_long: bool, collateral: u64, leverage: u64, current_price: u64) -> Result<()> {
    system_program::transfer(
        CpiContext::new(
            system_program::ID,
            Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.market.to_account_info(),
            },
        ),
        collateral,
    )?;

    let position = &mut ctx.accounts.position;
    position.market = ctx.accounts.market.key();
    position.owner = ctx.accounts.owner.key();
    position.is_long = is_long;
    position.collateral = collateral;
    position.entry_price = current_price;
    position.size = collateral.checked_mul(leverage).unwrap();
    position.is_active = true;
    position.final_payout = 0;
    position.liquidator = None;
    position.liquidator_reward = 0;
    position.bump = ctx.bumps.position;
    Ok(())
}

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        init,
        payer = owner,
        space = Position::LEN,
        seeds = [POSITION_SEED, market.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    pub system_program: Program<'info, System>,
}

pub fn handle_close_position(ctx: Context<ClosePosition>, current_price: u64) -> Result<()> {
    let position = &mut ctx.accounts.position;
    require!(position.is_active, ErrorCode::PositionAlreadyClosed);

    let price_diff = if position.is_long {
        current_price as i128 - position.entry_price as i128
    } else {
        position.entry_price as i128 - current_price as i128
    };

    let pnl = (position.size as i128 * price_diff) / position.entry_price as i128;
    let final_payout = (position.collateral as i128 + pnl).max(0) as u64;

    position.is_active = false;
    position.final_payout = final_payout;

    Ok(())
}

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        has_one = owner,
    )]
    pub position: Account<'info, Position>,
}

pub fn handle_liquidate_position(ctx: Context<LiquidatePosition>, current_price: u64) -> Result<()> {
    let position = &mut ctx.accounts.position;
    require!(position.is_active, ErrorCode::PositionAlreadyClosed);

    let price_diff = if position.is_long {
        current_price as i128 - position.entry_price as i128
    } else {
        position.entry_price as i128 - current_price as i128
    };

    let pnl = (position.size as i128 * price_diff) / position.entry_price as i128;
    let remaining_margin = position.collateral as i128 + pnl;

    // 5% maintenance margin
    let maintenance_margin = (position.size * 5) / 100;

    require!(remaining_margin < maintenance_margin as i128, ErrorCode::NotLiquidatable);

    let payout = remaining_margin.max(0) as u64;

    position.is_active = false;
    position.liquidator = Some(ctx.accounts.liquidator.key());
    position.liquidator_reward = payout;

    Ok(())
}

#[derive(Accounts)]
pub struct LiquidatePosition<'info> {
    pub liquidator: Signer<'info>,
    #[account(mut)]
    pub position: Account<'info, Position>,
}

pub fn handle_settle_funds(ctx: Context<SettleFunds>) -> Result<()> {
    let position = &mut ctx.accounts.position;
    let market = &mut ctx.accounts.market;

    require!(!position.is_active, ErrorCode::PositionNotClosed);

    if position.final_payout > 0 {
        **market.to_account_info().try_borrow_mut_lamports()? = market.to_account_info().lamports().checked_sub(position.final_payout).unwrap();
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? = ctx.accounts.owner.to_account_info().lamports().checked_add(position.final_payout).unwrap();
    }

    if position.liquidator_reward > 0 {
        let liquidator_info = ctx.accounts.liquidator.as_ref().unwrap();
        require_keys_eq!(liquidator_info.key(), position.liquidator.unwrap(), ErrorCode::Unauthorized);
        
        **market.to_account_info().try_borrow_mut_lamports()? = market.to_account_info().lamports().checked_sub(position.liquidator_reward).unwrap();
        **liquidator_info.try_borrow_mut_lamports()? = liquidator_info.lamports().checked_add(position.liquidator_reward).unwrap();
    }

    Ok(())
}

#[derive(Accounts)]
pub struct SettleFunds<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    /// CHECK: The owner of the position receiving the final payout
    #[account(mut)]
    pub owner: UncheckedAccount<'info>,
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        close = owner,
        has_one = owner,
        has_one = market
    )]
    pub position: Account<'info, Position>,
    /// CHECK: Optional liquidator receiving the reward
    #[account(mut)]
    pub liquidator: Option<UncheckedAccount<'info>>,
}
