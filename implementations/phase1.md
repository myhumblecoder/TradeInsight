# Phase 1: Single-Crypto Narrative Dashboard

## Overview

Build a simple React TypeScript UI for a single cryptocurrency (e.g., BTC) that fetches data from Coinbase APIs, computes indicators (RSI, EMA, MACD), and displays an informative narrative "article" explaining price, stop loss, bid/sell, and time length, with a confidence score. No visuals; focus on text-based advisory.

## Goals

- Validate core data fetching and narrative generation.
- Establish TDD, CI, and logging foundations.
- Relaxing color scheme with light/dark mode.

## Requirements

- Fetch current price, historical candles, and bid/ask spread/order book from Coinbase Pro API.
- Compute indicators using technicalindicators library.
- Generate templated article text with explanations and confidence score (0-100% based on indicator alignment).
- UI: Single page with article display, dark mode toggle.
- Responsive design with Tailwind CSS.
- Handle API failures (e.g., rate limits, network errors) with loading states, retries, and user feedback.
- Manage API keys securely via environment variables.

## Tasks

1. Set up Vite + React TS + Tailwind 3 + Vitest.
2. Implement data hooks for API fetching, including bid/ask data.
3. Add indicator calculations and error handling.
4. Create article generation logic with confidence scoring.
5. Build UI components (article, toggle) with relaxing colors.
6. Add Pino logging, error boundaries, and GitHub Actions CI.
7. Test with TDD (unit for calculations, integration for UI/API).

## Dependencies

- React, Vite, Tailwind, Vitest, Pino, technicalindicators.
- Coinbase API access.

## Acceptance Criteria

- App loads with BTC article, bid/sell explanations, and score.
- Data refreshes every 30s; errors show user-friendly messages.
- Passes all tests and builds in CI.
