# Phase 2: Master-Detail Multi-Crypto Interface

## Overview

Expand to a "magazine" style: Overview page with cards for top 10 cryptos (small summaries), clickable to detail page with full article, confidence score, and controls to adjust time period/interval for regenerating metrics.

## Goals

- Enable multi-crypto exploration.
- Add navigation and dynamic data.
- Enhance user engagement.

## Requirements

- Fetch top cryptos list from CoinGecko API (or static fallback).
- Overview: Grid of cards with teaser summaries.
- Detail: Full article + score, with dropdowns for period (e.g., 1d-1w) and interval (e.g., 1h-1d).
- Regenerate indicators/article on changes.
- Routing between pages (e.g., React Router).
- Implement caching/debouncing for API calls to handle limits.
- Use Context API for state management across pages.
- Ensure accessibility (ARIA labels, keyboard nav) and mobile responsiveness.

## Tasks

1. Add routing, card components, and CoinGecko API integration.
2. Implement overview page with top cryptos fetching.
3. Build detail page with controls and dynamic updates.
4. Update data fetching for periods/intervals with caching.
5. Integrate with phase 1 logic and add accessibility features.
6. Test navigation, updates, and responsiveness.

## Dependencies

- React Router, CoinGecko API, additional state management if needed.

## Acceptance Criteria

- 10 crypto cards load with summaries.
- Clicking opens detail with adjustable metrics and bid/ask data.
- Article updates on period change; accessible on mobile.
