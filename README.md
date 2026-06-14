# Limit Break Perpetuals (PredictPerps)

- **App:** [predictperps.vercel.app](https://predictperps.vercel.app)
- **Demo / Presentation:** [youtu.be/eVFSzpwVUL8](https://youtu.be/eVFSzpwVUL8)

**Limit Break Perpetuals** is a decentralized perpetual futures protocol built on Solana that provides a CEX-like trading experience with fully on-chain settlement. 

By leveraging **MagicBlock's Private Ephemeral Rollups**, the protocol can process high-frequency trading actions (such as opening, closing, and liquidating positions) securely inside a Trusted Execution Environment (TEE). Users delegate their position accounts to the Ephemeral Rollup, enabling zero-gas, ultra-low-latency trades off-chain, completely removing the burden of L1 transaction fees for every order. Once trading is complete, the final state is seamlessly committed back to the Solana mainnet.

## Key Features
- **Gasless, High-Frequency Trading:** Trade off-chain via MagicBlock Ephemeral Rollups without paying L1 Solana fees per transaction.
- **Self-Custodial & Secure:** All settlements and funds are secured on the Solana base layer.
- **Leveraged Trading:** Open long or short positions with collateral and multiplier-based leverage.
- **Privacy-Enhanced:** Trading logic execution is isolated inside a TEE during active delegation.
- **Seamless UX:** Users experience the speed and zero-fee benefits of a centralized exchange while retaining custody.

## Program Architecture

The smart contract is written using the Anchor framework and interfaces with the `ephemeral-rollups-sdk`. Below are the core instructions:

- `delegate`: Delegates a position to the Private Ephemeral Rollup, moving state management off-chain to the TEE.
- `open_position`: Opens a Long/Short position by staking collateral with leverage.
- `close_position`: Closes the position inside the Ephemeral Rollup, computing the Profit and Loss (PnL) based on the current price.
- `liquidate_position`: Liquidates the position if the margin falls below the 5% maintenance threshold.
- `reveal_position`: Commits and undelegates the updated position state back to the Solana base layer.
- `settle_funds`: Settles funds (transferring collateral + PnL) on the base layer after the position has been closed off-chain.

## Project Structure

- `programs/perp/`: The Anchor smart contract containing the core perpetuals logic and Ephemeral Rollups integration.
- `client/`: A Next.js front-end application built with React, Tailwind CSS, and the `@solana/wallet-adapter` to interact with the on-chain program and the TEE RPC.

## Getting Started

### Prerequisites
- Node.js & Yarn/Bun/npm
- Rust & Solana CLI
- Anchor CLI

### Smart Contract
1. Navigate to the project root:
   ```bash
   cd demo/perp
   ```
2. Build the Anchor program:
   ```bash
   anchor build
   ```
3. Deploy to Solana Devnet (ensure your `Anchor.toml` points to your active wallet and the correct cluster):
   ```bash
   anchor deploy
   ```

### Running the Client Locally
1. Navigate to the client directory:
   ```bash
   cd demo/perp/client
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run the development server:
   ```bash
   bun run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Technologies Used
- **Solana** - High-speed base layer blockchain
- **Anchor** - Solana smart contract framework
- **MagicBlock Ephemeral Rollups** - TEE-based off-chain transaction execution
- **Next.js & React** - Frontend framework
- **Tailwind CSS** - UI styling
