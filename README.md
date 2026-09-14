# TindaTrack

TindaTrack is an offline-first inventory and sales notebook for small sari-sari stores. It is built with Expo React Native, TypeScript, Expo Router, and SQLite.

## Android APK

An installable Android build is included at [`release/TindaTrack-v1.0.0.apk`](release/TindaTrack-v1.0.0.apk).

- Version: 1.0.0
- Package: `com.tindatrack.app`
- SHA-256: `1D64429DDCAE62018C2BBE966A27573D791C347FE0898B9869A0C6A1C37ACFF1`
- Signing: development/testing key; suitable for direct MVP testing, not a Google Play production release

On an Android phone, download the APK, allow installation from the browser or file manager when prompted, and open the downloaded file.

## Included in the MVP

- Store setup and four-tab navigation
- Product creation with optional photos
- Current stock, low-stock warnings, and out-of-stock states
- Restocking, physical count corrections, and readable stock history
- Product selling with cart quantities and stock validation
- Atomic sale completion and automatic inventory deduction
- Historical cost and selling-price snapshots
- Sale confirmation, details, and undo with stock restoration
- Home summary, recent sales, and a floating Add Sale action
- Today, week, and month sales history
- 7-day, 30-day, and 3-month sales insights
- Highest day, lowest day, average sales, profit, and period comparison
- Daily notes and past-day summaries
- Offline SQLite persistence

## Run locally

```bash
npm install
npm start
```

Then open the project with Expo Go or press `a` from the Expo terminal to use an Android emulator.

Useful commands:

```bash
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform android
```

## Core acceptance workflow

1. Add Coke with a cost of ₱15, a selling price of ₱20, and 20 items in stock.
2. Add two Coke to a sale and confirm it.
3. Confirm the stock becomes 18, sales increase by ₱40, and estimated profit increases by ₱10.
4. Confirm the transaction appears in Recent Sales, Sales History, and Sales Insights.
5. Save “Buy Coke tomorrow” in Daily Note.
6. Restart the app offline and confirm the data remains.
7. Undo the sale and confirm the stock returns to 20 and totals are recalculated.

## Data rules

- Money is stored as integer centavos.
- Stock cannot become negative.
- Every stock change creates a stock-history entry.
- Completed sales preserve cost and price snapshots.
- Voided sales are excluded from summaries and insights.
- Products are archived rather than permanently deleted.
- Days without sales count as zero in averages and low-sales insights.

## Current scope

This repository contains the offline V1 MVP. Cloud backup, full utang management, suppliers, expenses, employee accounts, advanced accounting, and forecasting are intentionally excluded.
