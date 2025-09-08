# TradingView Lightweight Charts - React Tutorials

This directory contains comprehensive tutorials and documentation for implementing TradingView Lightweight Charts in React applications.

## 📚 Documentation Structure

### Tutorials
1. **[01-simple-chart.md](./01-simple-chart.md)** - Getting started with basic charts
   - Project setup
   - Basic chart component
   - Different series types
   - Responsive design
   - Data formats

2. **[02-advanced-chart.md](./02-advanced-chart.md)** - Advanced patterns and architecture
   - Component composition with Context
   - Dynamic series management
   - Real-time data handling
   - Interactive features
   - Performance optimization

3. **[03-real-time-updates.md](./03-real-time-updates.md)** - Real-time data streaming
   - WebSocket integration
   - Server-Sent Events (SSE)
   - Polling patterns
   - Data buffering and throttling
   - Error handling and recovery

4. **[04-multiple-series.md](./04-multiple-series.md)** - Multiple series and indicators
   - Technical indicators (SMA, RSI, MACD, Bollinger Bands)
   - Synchronized charts
   - Dynamic indicator management
   - Comparison charts
   - Volume analysis

5. **[05-customization-styling.md](./05-customization-styling.md)** - Theming and customization
   - Theme management
   - Custom tooltips and legends
   - Gradient areas and patterns
   - Mobile responsive design
   - Watermarks

### Reference
- **[api-reference.md](./api-reference.md)** - Complete API documentation
  - Chart creation and options
  - All series types
  - Methods and events
  - TypeScript definitions

## 🚀 Quick Start

### Installation

```bash
npm install lightweight-charts
# or
yarn add lightweight-charts
# or
pnpm add lightweight-charts
```

### Basic Example

```jsx
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export const Chart = ({ data }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        const series = chart.addLineSeries();
        series.setData(data);

        return () => chart.remove();
    }, [data]);

    return <div ref={chartContainerRef} />;
};
```

## 📦 Complete Examples

### Trading Dashboard

```jsx
import React from 'react';
import { ChartProvider } from './ChartContext';
import { CandlestickChart } from './CandlestickChart';
import { VolumeIndicator } from './VolumeIndicator';
import { RSIIndicator } from './RSIIndicator';

export const TradingDashboard = ({ symbol }) => {
    return (
        <ChartProvider symbol={symbol}>
            <div className="trading-dashboard">
                <CandlestickChart />
                <VolumeIndicator />
                <RSIIndicator />
            </div>
        </ChartProvider>
    );
};
```

### Real-Time Price Chart

```jsx
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { useWebSocket } from './useWebSocket';

export const RealTimeChart = ({ wsUrl, symbol }) => {
    const chartContainerRef = useRef();
    const series = useRef();
    
    const { data } = useWebSocket(wsUrl, {
        subscribe: { symbol, type: 'trades' }
    });

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        series.current = chart.addLineSeries();

        return () => chart.remove();
    }, []);

    useEffect(() => {
        if (data && series.current) {
            series.current.update({
                time: data.timestamp,
                value: data.price
            });
        }
    }, [data]);

    return <div ref={chartContainerRef} />;
};
```

## 🎨 Themes

### Dark Theme

```javascript
const darkTheme = {
    layout: {
        background: { type: 'solid', color: '#1e222d' },
        textColor: '#d1d4dc',
    },
    grid: {
        vertLines: { color: '#363c4e' },
        horzLines: { color: '#363c4e' },
    },
    candlestick: {
        upColor: '#26a69a',
        downColor: '#ef5350',
    },
};
```

### Light Theme

```javascript
const lightTheme = {
    layout: {
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#191919',
    },
    grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
    },
    candlestick: {
        upColor: '#26a69a',
        downColor: '#ef5350',
    },
};
```

## 📊 Series Types

- **Line Series** - Simple line charts
- **Area Series** - Area charts with gradients
- **Candlestick Series** - OHLC candlestick charts
- **Bar Series** - OHLC bar charts
- **Histogram Series** - Volume and histogram data
- **Baseline Series** - Baseline comparison charts

## 🛠️ Key Features

- ✅ Lightweight and performant
- ✅ Mobile responsive
- ✅ Touch support
- ✅ Real-time updates
- ✅ Multiple series support
- ✅ Technical indicators
- ✅ Customizable themes
- ✅ TypeScript support
- ✅ No dependencies

## 🔧 Advanced Features

### Custom Indicators

```javascript
// Calculate Simple Moving Average
const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].value;
        }
        sma.push({
            time: data[i].time,
            value: sum / period
        });
    }
    return sma;
};
```

### WebSocket Integration

```javascript
const ws = new WebSocket('wss://api.exchange.com/ws');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    series.update({
        time: data.timestamp,
        value: data.price
    });
};
```

### Synchronized Charts

```javascript
chart1.timeScale().subscribeVisibleTimeRangeChange(() => {
    chart2.timeScale().setVisibleRange(
        chart1.timeScale().getVisibleRange()
    );
});
```

## 📖 Best Practices

1. **Memory Management**
   - Always remove charts in cleanup functions
   - Unsubscribe from events
   - Clear intervals and timeouts

2. **Performance**
   - Use `update()` instead of `setData()` for real-time updates
   - Implement data buffering for high-frequency updates
   - Throttle or debounce updates when necessary

3. **React Patterns**
   - Use refs for chart instances
   - Implement proper cleanup in useEffect
   - Memoize expensive calculations
   - Use Context for shared chart state

4. **Error Handling**
   - Implement error boundaries
   - Handle WebSocket disconnections
   - Validate data before updating charts

## 🔗 Resources

- **Official Documentation**: [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- **GitHub Repository**: [lightweight-charts](https://github.com/tradingview/lightweight-charts)
- **Examples**: [Official Examples](https://github.com/tradingview/lightweight-charts/tree/master/website/docs/examples)

## 📄 License

TradingView Lightweight Charts is licensed under Apache License 2.0.

## 🤝 Attribution

When using Lightweight Charts, you must provide attribution to TradingView.

---

## Examples Index

### Basic Examples
- Simple line chart
- Candlestick chart
- Area chart with gradient
- Volume histogram

### Advanced Examples
- Real-time WebSocket updates
- Multiple synchronized charts
- Technical indicators overlay
- Custom tooltips and legends

### Production Examples
- Complete trading interface
- Mobile-responsive dashboard
- Theme switching
- Performance-optimized charts

For detailed implementations, refer to the individual tutorial files.