use anchor_lang::prelude::*;

/// Position: scoped by (market_id, owner). No separate Market account needed.
#[account]
pub struct Position {
    /// The u64 card ID used as the market identifier (= card.id from the dataset).
    pub market_id: u64,
    pub owner: Pubkey,
    pub is_long: bool,
    pub collateral: u64,
    pub entry_price: u64,
    pub size: u64,
    pub is_active: bool,
    pub final_payout: u64,
    pub liquidator: Option<Pubkey>,
    pub liquidator_reward: u64,
    pub bump: u8,
}

impl Position {
    pub const LEN: usize = 8  // discriminator
        + 8  // market_id
        + 32 // owner
        + 1  // is_long
        + 8  // collateral
        + 8  // entry_price
        + 8  // size
        + 1  // is_active
        + 8  // final_payout
        + 33 // liquidator (Option<Pubkey>)
        + 8  // liquidator_reward
        + 1; // bump
}
