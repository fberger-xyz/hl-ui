# TradingView Charting Library

## How to obtain the library files:

1. Go to https://www.tradingview.com/charting-library/
2. Click "Get Library" button
3. Fill out the access request form
4. You'll receive an email with access to the private GitHub repository

## What files to place here:

After getting access, download and extract the library files here:

```
public/static/charting_library/
├── charting_library.js          # Main library file (REQUIRED)
├── charting_library.d.ts        # TypeScript definitions
├── bundles/                     # Additional bundles
├── static/                      # Static assets
└── datafeeds/                   # Optional datafeed implementations
```

## Quick Setup:

1. Clone the TradingView charting_library repository
2. Copy the entire contents to this directory
3. The chart will automatically start working

Note: The library is free but requires registration. It's not available via NPM.