use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Account is not authorized for this action")]
    Unauthorized,
    #[msg("Position margin is sufficient, cannot be liquidated")]
    NotLiquidatable,
    #[msg("Position is already closed")]
    PositionAlreadyClosed,
    #[msg("Position is not closed yet")]
    PositionNotClosed,
}
