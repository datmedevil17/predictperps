use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::access_control::instructions::{
    CommitAndUndelegatePermissionCpiBuilder, CreatePermissionCpiBuilder,
    DelegatePermissionCpiBuilder, UpdatePermissionCpiBuilder,
};
use ephemeral_rollups_sdk::access_control::structs::{Member, MembersArgs, PERMISSION_SEED};
use ephemeral_rollups_sdk::anchor::{commit, delegate};
use ephemeral_rollups_sdk::consts::PERMISSION_PROGRAM_ID;
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{FoldableIntentBuilder, MagicIntentBundleBuilder};

use crate::constants::POSITION_SEED;
use crate::state::{Market, Position};

/// Atomically create/update the position's permission account, delegate the
/// permission account, and delegate the position itself. After this, the
/// position lives on the Private ER and `side`/`amount` are hidden from
/// everyone except the members listed in `members`.
/// ANYONE can invoke_signed, may want to set checks/guards.
pub fn handle_delegate(ctx: Context<DelegatePositionPrivately>, members: Option<Vec<Member>>) -> Result<()> {
    let validator_info = ctx.accounts.validator.as_ref().map(|v| v.to_account_info());
    let validator = validator_info.as_ref();
    let market_key = ctx.accounts.market.key();
    let owner_key = ctx.accounts.payer.key();
    let bump = ctx.bumps.position;
    let seeds: &[&[u8]] = &[POSITION_SEED, market_key.as_ref(), owner_key.as_ref(), &[bump]];

    // 1. Create / update the permission account before delegating.
    if ctx.accounts.permission.data_is_empty() {
        CreatePermissionCpiBuilder::new(&ctx.accounts.permission_program)
            .permissioned_account(&ctx.accounts.position.to_account_info())
            .permission(&ctx.accounts.permission.to_account_info())
            .payer(&ctx.accounts.payer.to_account_info())
            .system_program(&ctx.accounts.system_program.to_account_info())
            .args(MembersArgs { members })
            .invoke_signed(&[seeds])?;
    } else {
        UpdatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
            .authority(&ctx.accounts.payer.to_account_info(), true)
            .permissioned_account(&ctx.accounts.position.to_account_info(), true)
            .permission(&ctx.accounts.permission.to_account_info())
            .args(MembersArgs { members })
            .invoke_signed(&[seeds])?;
    }

    // 2. Delegate the permission account so member updates run on the ER.
    if ctx.accounts.permission.owner != &ephemeral_rollups_sdk::id() {
        DelegatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
            .permissioned_account(&ctx.accounts.position.to_account_info(), true)
            .permission(&ctx.accounts.permission.to_account_info())
            .payer(&ctx.accounts.payer.to_account_info())
            .authority(&ctx.accounts.position.to_account_info(), false)
            .system_program(&ctx.accounts.system_program.to_account_info())
            .owner_program(&ctx.accounts.permission_program.to_account_info())
            .delegation_buffer(&ctx.accounts.buffer_permission.to_account_info())
            .delegation_metadata(&ctx.accounts.delegation_metadata_permission.to_account_info())
            .delegation_record(&ctx.accounts.delegation_record_permission.to_account_info())
            .delegation_program(&ctx.accounts.delegation_program.to_account_info())
            .validator(validator)
            .invoke_signed(&[seeds])?;
    }

    // 3. Delegate the position itself.
    if ctx.accounts.position.owner != &ephemeral_rollups_sdk::id() {
        ctx.accounts.delegate_position(
            &ctx.accounts.payer,
            &[POSITION_SEED, market_key.as_ref(), owner_key.as_ref()],
            DelegateConfig {
                validator: validator.map(|v| v.key()),
                ..Default::default()
            },
        )?;
    }
    Ok(())
}

/// Add delegate function to the context.
#[delegate]
#[derive(Accounts)]
pub struct DelegatePositionPrivately<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub market: Account<'info, Market>,
    /// CHECK: The PDA to delegate
    #[account(mut, del, seeds = [POSITION_SEED, market.key().as_ref(), payer.key().as_ref()], bump)]
    pub position: UncheckedAccount<'info>,
    /// CHECK: Permission account for the position PDA
    #[account(mut, seeds = [PERMISSION_SEED, position.key().as_ref()], bump, seeds::program = permission_program.key())]
    pub permission: UncheckedAccount<'info>,
    /// CHECK: Buffer for permission delegation
    #[account(mut, seeds = [ephemeral_rollups_sdk::pda::DELEGATE_BUFFER_TAG, permission.key().as_ref()], bump, seeds::program = PERMISSION_PROGRAM_ID)]
    pub buffer_permission: UncheckedAccount<'info>,
    /// CHECK: Delegation record for permission
    #[account(mut, seeds = [ephemeral_rollups_sdk::pda::DELEGATION_RECORD_TAG, permission.key().as_ref()], bump, seeds::program = ephemeral_rollups_sdk::id())]
    pub delegation_record_permission: UncheckedAccount<'info>,
    /// CHECK: Delegation metadata for permission
    #[account(mut, seeds = [ephemeral_rollups_sdk::pda::DELEGATION_METADATA_TAG, permission.key().as_ref()], bump, seeds::program = ephemeral_rollups_sdk::id())]
    pub delegation_metadata_permission: UncheckedAccount<'info>,
    /// CHECK: Permission Program
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Checked by the delegate program
    pub validator: Option<UncheckedAccount<'info>>,
}


/// Commit and undelegate both the permission account and the position in
/// one atomic ER transaction, revealing `side`/`amount` on the base layer.
/// Only callable once `market.resolution_time` has passed.
/// ANYONE can invoke_signed, may want to set checks/guards.
pub fn handle_reveal_position(ctx: Context<RevealPosition>) -> Result<()> {
    let market_key = ctx.accounts.market.key();
    let owner_key = ctx.accounts.position.owner;
    let bump = ctx.accounts.position.bump;
    let seeds: &[&[u8]] = &[POSITION_SEED, market_key.as_ref(), owner_key.as_ref(), &[bump]];

    // 1. Commit and undelegate the permission account.
    CommitAndUndelegatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
        .authority(&ctx.accounts.payer.to_account_info(), true)
        .permissioned_account(&ctx.accounts.position.to_account_info(), true)
        .permission(&ctx.accounts.permission.to_account_info())
        .magic_context(&ctx.accounts.magic_context.to_account_info())
        .magic_program(&ctx.accounts.magic_program.to_account_info())
        .invoke_signed(&[seeds])?;

    // 2. Commit and undelegate the position.
    MagicIntentBundleBuilder::new(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.magic_context.to_account_info(),
        ctx.accounts.magic_program.to_account_info(),
    )
    .commit_and_undelegate(&[ctx.accounts.position.to_account_info()])
    .build_and_invoke()?;
    Ok(())
}

#[commit]
#[derive(Accounts)]
pub struct RevealPosition<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [POSITION_SEED, market.key().as_ref(), position.owner.as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,
    /// CHECK: Checked by the permission program
    #[account(mut, seeds = [PERMISSION_SEED, position.key().as_ref()], bump, seeds::program = permission_program.key())]
    pub permission: UncheckedAccount<'info>,
    /// CHECK: Permission Program
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,
}
