pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::access_control::structs::Member;
use ephemeral_rollups_sdk::anchor::ephemeral;

pub use constants::*;

declare_id!("7e8rqStv4BdBfGpdRisahbmSc4EaivevxKuzgUhc7uxS");

use crate::instructions::*;

#[ephemeral]
#[program]
pub mod perp {
    use super::*;

    /// Open a Long/Short position by staking collateral with leverage.
    /// market_id is the card's numeric ID (card.id) — no separate Market
    /// account needs to be created first.
    pub fn open_position(
        ctx: Context<OpenPosition>,
        market_id: u64,
        is_long: bool,
        collateral: u64,
        leverage: u64,
        current_price: u64,
    ) -> Result<()> {
        handle_open_position(ctx, market_id, is_long, collateral, leverage, current_price)
    }

    /// Close the position inside the ER, computing PnL from current_price.
    pub fn close_position(ctx: Context<ClosePosition>, current_price: u64) -> Result<()> {
        handle_close_position(ctx, current_price)
    }

    /// Liquidate the position if margin is below 5% maintenance threshold.
    pub fn liquidate_position(
        ctx: Context<LiquidatePosition>,
        current_price: u64,
    ) -> Result<()> {
        handle_liquidate_position(ctx, current_price)
    }

    /// Delegate the position to the Private Ephemeral Rollup.
    pub fn delegate(
        ctx: Context<DelegatePositionPrivately>,
        _market_id: u64,
        members: Option<Vec<Member>>,
    ) -> Result<()> {
        handle_delegate(ctx, members)
    }

    /// Commit and undelegate the position back to the base layer.
    pub fn reveal_position(ctx: Context<RevealPosition>, _market_id: u64) -> Result<()> {
        handle_reveal_position(ctx)
    }

    /// Settle funds on the base layer after closing the position inside the ER.
    pub fn settle_funds(ctx: Context<SettleFunds>) -> Result<()> {
        handle_settle_funds(ctx)
    }
}
