# Simple TradingView Lightweight Charts in React

## Overview
This tutorial demonstrates how to create a basic TradingView Lightweight Chart in a React application.

## Prerequisites
- Node.js and npm installed
- Basic knowledge of React and hooks
- Understanding of useEffect and useRef

## Project Setup

### 1. Create a New React Project

Using Vite (Recommended):
```bash
npm create vite@latest my-trading-chart -- --template react
cd my-trading-chart
npm install
```

Or using Create React App:
```bash
npx create-react-app my-trading-chart
cd my-trading-chart
```

### 2. Install Lightweight Charts
```bash
npm install lightweight-charts
```

## Creating the Chart Component

### Basic Chart Component

```jsx
// ChartComponent.jsx
import { createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export const ChartComponent = props => {
    const {
        data,
        colors: {
            backgroundColor = 'white',
            lineColor = '#2962FF',
            textColor = 'black',
            areaTopColor = '#2962FF',
            areaBottomColor = 'rgba(41, 98, 255, 0.28)',
        } = {},
    } = props;

    const chartContainerRef = useRef();

    useEffect(() => {
        const handleResize = () => {
            chart.applyOptions({ 
                width: chartContainerRef.current.clientWidth 
            });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
        });
        
        chart.timeScale().fitContent();

        const newSeries = chart.addAreaSeries({ 
            lineColor, 
            topColor: areaTopColor, 
            bottomColor: areaBottomColor 
        });
        
        newSeries.setData(data);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

    return (
        <div ref={chartContainerRef} />
    );
};
```

## Using the Chart Component

### App Component with Sample Data

```jsx
// App.jsx
import React from 'react';
import { ChartComponent } from './ChartComponent';

const initialData = [
    { time: '2018-12-22', value: 32.51 },
    { time: '2018-12-23', value: 31.11 },
    { time: '2018-12-24', value: 27.02 },
    { time: '2018-12-25', value: 27.32 },
    { time: '2018-12-26', value: 25.17 },
    { time: '2018-12-27', value: 28.89 },
    { time: '2018-12-28', value: 25.46 },
    { time: '2018-12-29', value: 23.92 },
    { time: '2018-12-30', value: 22.68 },
    { time: '2018-12-31', value: 22.67 },
];

function App() {
    return (
        <div className="App">
            <h1>TradingView Lightweight Charts</h1>
            <ChartComponent 
                data={initialData}
                colors={{
                    backgroundColor: 'white',
                    lineColor: '#2962FF',
                    textColor: 'black',
                    areaTopColor: '#2962FF',
                    areaBottomColor: 'rgba(41, 98, 255, 0.28)',
                }}
            />
        </div>
    );
}

export default App;
```

## Customization Options

### Chart Options
```jsx
const chart = createChart(container, {
    width: 600,
    height: 300,
    layout: {
        background: { 
            type: ColorType.Solid, 
            color: '#FFFFFF' 
        },
        textColor: '#333',
        fontSize: 12,
        fontFamily: 'Calibri',
    },
    grid: {
        vertLines: {
            color: 'rgba(197, 203, 206, 0.5)',
            style: 1,
            visible: true,
        },
        horzLines: {
            color: 'rgba(197, 203, 206, 0.5)',
            style: 1,
            visible: true,
        },
    },
    timeScale: {
        borderColor: 'rgba(197, 203, 206, 1)',
        timeVisible: true,
        secondsVisible: false,
    },
    priceScale: {
        borderColor: 'rgba(197, 203, 206, 1)',
    },
});
```

### Series Types

#### Line Series
```jsx
const lineSeries = chart.addLineSeries({
    color: '#2962FF',
    lineWidth: 2,
});
```

#### Candlestick Series
```jsx
const candlestickSeries = chart.addCandlestickSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
});
```

#### Bar Series
```jsx
const barSeries = chart.addBarSeries({
    upColor: '#26a69a',
    downColor: '#ef5350',
    openVisible: false,
    thinBars: true,
});
```

#### Histogram Series
```jsx
const histogramSeries = chart.addHistogramSeries({
    color: '#26a69a',
    priceFormat: {
        type: 'volume',
    },
});
```

## Responsive Design

### Making the Chart Responsive

```jsx
export const ResponsiveChart = ({ data }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const resizeObserver = useRef();

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 400,
        });

        const series = chart.current.addAreaSeries();
        series.setData(data);

        // Use ResizeObserver for better performance
        resizeObserver.current = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            chart.current.applyOptions({ width, height });
            setTimeout(() => {
                chart.current.timeScale().fitContent();
            }, 0);
        });

        resizeObserver.current.observe(chartContainerRef.current);

        return () => {
            resizeObserver.current.disconnect();
            chart.current.remove();
        };
    }, [data]);

    return (
        <div 
            ref={chartContainerRef} 
            style={{ 
                width: '100%', 
                height: '400px',
                position: 'relative' 
            }} 
        />
    );
};
```

## Data Format

### Time Series Data
```javascript
const data = [
    { time: '2019-04-11', value: 80.01 },
    { time: '2019-04-12', value: 96.63 },
    { time: '2019-04-13', value: 76.64 },
    // ... more data points
];
```

### Candlestick Data
```javascript
const candleData = [
    { 
        time: '2019-04-11', 
        open: 80.01, 
        high: 82.15, 
        low: 79.50, 
        close: 81.75 
    },
    // ... more candles
];
```

### Volume Data
```javascript
const volumeData = [
    { time: '2019-04-11', value: 123456, color: 'rgba(0, 150, 136, 0.8)' },
    { time: '2019-04-12', value: 234567, color: 'rgba(255, 82, 82, 0.8)' },
    // ... more volume bars
];
```

## Common Patterns

### Loading State
```jsx
export const ChartWithLoader = ({ data, loading }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        if (!loading && data) {
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 300,
            });

            const series = chart.addLineSeries();
            series.setData(data);

            return () => {
                chart.remove();
            };
        }
    }, [data, loading]);

    if (loading) {
        return <div>Loading chart...</div>;
    }

    return <div ref={chartContainerRef} />;
};
```

### Error Handling
```jsx
export const SafeChart = ({ data }) => {
    const chartContainerRef = useRef();
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const chart = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 300,
            });

            if (!data || data.length === 0) {
                throw new Error('No data available');
            }

            const series = chart.addLineSeries();
            series.setData(data);

            return () => {
                chart.remove();
            };
        } catch (err) {
            setError(err.message);
            console.error('Chart error:', err);
        }
    }, [data]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return <div ref={chartContainerRef} />;
};
```

## Best Practices

1. **Cleanup**: Always remove the chart in the cleanup function
2. **Refs**: Use refs to access DOM elements and store chart instances
3. **Dependencies**: Include all props used in useEffect dependencies
4. **Responsive**: Handle window resize events
5. **Performance**: Debounce resize handlers for better performance
6. **Data Validation**: Validate data before passing to the chart

## Next Steps

- Add interactive features (tooltips, crosshairs)
- Implement real-time data updates
- Add multiple series to the same chart
- Customize chart appearance and behavior
- Add technical indicators