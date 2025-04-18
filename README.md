# LocalSolana Frontend

A Vite + React frontend for the [LocalSolana](https://LocalSolana.com/) P2P trading and remittances decentralized application (dapp) on Solana.

This repository serves as the user interface for LocalSolana, a decentralized peer-to-peer (P2P) exchange and remittances marketplace designed to facilitate secure, borderless cryptocurrency trading with fiat on-ramps and off-ramps.

![LocalSolana logo](https://raw.githubusercontent.com/Panmoni/localsolana/refs/heads/main/public/logo.png)

## Overview

### The Big Picture

LocalSolana is a Solana dapp for P2P trading and remittances. Our mission is to break down traditional financial barriers and unlock economic potential in emerging markets by enabling direct, trustless trades between peers worldwide. By leveraging Solana’s high-speed, low-cost blockchain, we provide a decentralized alternative to centralized exchanges, prioritizing financial inclusion, flexibility and community ownership.

#### Why It Matters
- **Financial Inclusion**: Over 1 billion people lack formal IDs and 2 billion are unbanked or underbanked. LocalSolana offers a KYC-free, accessible trading solution, empowering those excluded from traditional finance.
- **Affordable Remittances**: High remittance fees (6.2% globally in 2023 vs. the World Bank’s 3% target) disproportionately affect small transfers (sub-$200) to regions like Africa, Southeast Asia and Latin America. LocalSolana reduces costs by chaining P2P trades over stablecoin rails, bypassing expensive legacy systems and unlocking billions in trapped capital.
- **Economic Empowerment**: By facilitating low-cost, censorship-resistant fiat-to-fiat transactions, we enable families to access basic needs, support entrepreneurship and drive economic growth in underserved markets.
- **Decentralized Future**: Unlike Web2 platforms, we’re building a truly community-owned network, evolving with its users to transform developing economies into vibrant, connected markets.

#### Remittances Vision
LocalSolana reimagines remittances by allowing users to chain together P2P trades into seamless fiat-in, fiat-out transactions. Traders use USDC as a fast, low-cost transport layer, while senders and receivers interact solely in their preferred fiat currencies—no crypto knowledge required. This approach eliminates intermediaries, reduces fees and provides crisis-resilient access to funds. Beyond cash transfers, we aim to support "combo remittances," where senders can buy essentials (e.g., groceries, medicine) cross-border for their loved ones from local merchants for direct delivery to recipients, enhancing economic impact.

### Key Features
- **Secure Escrow**: Smart contracts ensure funds are safe until trades complete.
- **Flexible Fiat Options**: Trade with any fiat payment method—community-driven additions welcome.
- **Dispute Resolution**: Fair outcomes backed by evidence and arbitration.
- **Trust Network**: Build reputation and connect with local, verified traders.
- **Local Focus**: Trade in your currency with peers who understand your market.

### LocalSolana Background

A product under the name LocalSolana was first developed by OpenPeer Labs before the company suddenly ceased operations in Feb 2025. Also, in Feb 2025, I, [George Donnelly](https://github.com/georgedonnelly), acquired the LocalSolana IP from OpenPeer Labs. Starting in Mar 2025, I am re-developing from scratch LocalSolana without using any of the previous code. This new LocalSolana codebase has not only traditional P2P trading features with on-chain escrow, but also the [YapBay sequential escrow system](https://yapbay.com/about/) in order to support P2P, fiat-in, fiat-out remittances functionality.

## System Architecture

LocalSolana is a modular ecosystem of interconnected repositories working together to deliver a seamless P2P trading experience. Here’s how they connect:

1. **[localsolana-contracts](https://github.com/Panmoni/localsolana-contracts)**
   - **Role**: The on-chain backbone, a Solana smart contract built with Anchor.
   - **Functionality**: Manages escrow creation, funding, fiat payment confirmation, release, cancellation and dispute resolution for USDC trades (max 100 USDC during the MVP, 1% fee, 5% dispute bond).
   - **Connection**: The frontend interacts with these contracts via Solana wallet integrations (e.g., Phantom) to sign and submit transactions like escrow funding or release.

2. **[localsolana-api](https://github.com/Panmoni/localsolana-api)**
   - **Role**: REST API for managing accounts, offers, trades and escrow instructions.
   - **Functionality**: Handles user accounts, trade offers, trade state updates and generates Solana instructions (unsigned) for on-chain actions. Uses PostgreSQL for storage and JWT for wallet-based authentication.
   - **Connection**: The frontend sends HTTP requests to this API to fetch trade data, post offers, or retrieve escrow instructions, which are then signed client-side.

3. **[localsolana](https://github.com/Panmoni/localsolana)** (this repo)
   - **Role**: The user interface, built with Vite + React.
   - **Functionality**: Displays trade offers, manages user interactions, integrates with Solana wallets and communicates with the API and pricing server.
   - **Connection**: Connects to the API for source-of-truth data and the contracts for on-chain actions, while querying the pricing server (via the API) for real-time fiat prices.

4. **[pricing](https://github.com/Panmoni/pricing)**
   - **Role**: Lightweight Express.js server for cryptocurrency price feeds.
   - **Functionality**: Provides real-time USDC prices in multiple fiat currencies (USD, EUR, COP, NGN, VES) using Coinranking API, cached with Redis.
   - **Connection**: The API queries this server’s `/prices` endpoint to display accurate fiat equivalents for trades. The frontend then talks to the API server to get the prices.

5. **[localsolana-listener](https://github.com/Panmoni/localsolana-listener)**
   - **Role**: TypeScript event listener for on-chain activities.
   - **Functionality**: Monitors Solana blockchain events (e.g., escrow creation, funding) to keep off-chain systems in sync.
   - **Connection**: Feeds real-time updates to the API and frontend via websockets or polling, ensuring UI reflects on-chain state.

6. **[localsolana-www](https://github.com/Panmoni/localsolana-www)**
   - **Role**: AstroJS static site for marketing and community engagement.
   - **Functionality**: Hosts the public-facing website (localsolana.com) with info about the project, roadmap and community links.
   - **Connection**: Links to the frontend for app access and serves as the entry point for new users.

### How It All Works Together
- A user visits `localsolana-www` to learn about the project and joins via the frontend.
- The frontend authenticates users via Solana wallet signatures, interacting with the API to create accounts or offers. It leverages https://dynamic.xyz.
- The pricing server provides fiat price data for offer creation and trade visualization.
- Trades are initiated via the API, which generates escrow instructions sent to the frontend for signing and submission to the contracts.
- The listener tracks on-chain events, updating the API in real-time.
- Disputes or completions are handled on-chain, with the frontend providing a seamless interface.

## Community
Join us to shape the future of decentralized trading and remittances:

- Telegram: Connect with the community in [English](https://t.me/Panmoni/802) or [Español](https://t.me/Panmoni/804).
- Waitlist: https://getwaitlist.com/waitlist/19781
- X: Follow updates. https://x.com/localsolana
- Website: https://LocalSolana.com

## License
MIT - See LICENSE for details.
