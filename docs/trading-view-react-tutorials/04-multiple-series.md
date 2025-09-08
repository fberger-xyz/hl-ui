# Multiple Series and Indicators in TradingView Lightweight Charts

## Overview
This guide covers working with multiple series, technical indicators, overlays, and complex chart compositions in TradingView Lightweight Charts.

## Basic Multiple Series

### Different Series Types on Same Chart

```jsx
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export const MultiSeriesChart = ({ data }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 500,
        });

        // Main price series (Candlestick)
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
        });
        candlestickSeries.setData(data.candles);

        // Moving Average overlay (Line)
        const maSeries = chart.addLineSeries({
            color: '#2962ff',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        maSeries.setData(data.movingAverage);

        // Volume histogram (bottom)
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });
        volumeSeries.setData(data.volume);

        return () => chart.remove();
    }, [data]);

    return <div ref={chartContainerRef} />;
};
```

## Technical Indicators

### Simple Moving Average (SMA)

```jsx
// indicators/sma.js
export const calculateSMA = (data, period) => {
    const sma = [];
    
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].value || data[i - j].close;
        }
        sma.push({
            time: data[i].time,
            value: sum / period
        });
    }
    
    return sma;
};

// SMAChart.jsx
export const SMAChart = ({ priceData, periods = [20, 50, 200] }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        // Price series
        const priceSeries = chart.addLineSeries({
            color: '#000',
            lineWidth: 2,
        });
        priceSeries.setData(priceData);

        // Add SMA lines
        const colors = ['#2962ff', '#ff6b6b', '#4ecdc4'];
        periods.forEach((period, index) => {
            const smaData = calculateSMA(priceData, period);
            const smaSeries = chart.addLineSeries({
                color: colors[index % colors.length],
                lineWidth: 1,
                title: `SMA ${period}`,
                priceLineVisible: false,
                lastValueVisible: false,
            });
            smaSeries.setData(smaData);
        });

        // Legend
        chart.timeScale().fitContent();

        return () => chart.remove();
    }, [priceData, periods]);

    return <div ref={chartContainerRef} />;
};
```

### Bollinger Bands

```jsx
// indicators/bollingerBands.js
export const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
    const bands = [];
    
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        const values = [];
        
        // Calculate SMA
        for (let j = 0; j < period; j++) {
            const value = data[i - j].value || data[i - j].close;
            values.push(value);
            sum += value;
        }
        const sma = sum / period;
        
        // Calculate standard deviation
        let squaredDiffSum = 0;
        values.forEach(value => {
            squaredDiffSum += Math.pow(value - sma, 2);
        });
        const standardDeviation = Math.sqrt(squaredDiffSum / period);
        
        bands.push({
            time: data[i].time,
            middle: sma,
            upper: sma + (standardDeviation * stdDev),
            lower: sma - (standardDeviation * stdDev)
        });
    }
    
    return bands;
};

// BollingerBandsChart.jsx
export const BollingerBandsChart = ({ priceData }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        // Price series
        const priceSeries = chart.addCandlestickSeries();
        priceSeries.setData(priceData);

        // Calculate Bollinger Bands
        const bands = calculateBollingerBands(priceData);

        // Upper band
        const upperBand = chart.addLineSeries({
            color: 'rgba(255, 82, 82, 0.5)',
            lineWidth: 1,
            lineStyle: 2, // Dashed
        });
        upperBand.setData(bands.map(b => ({ time: b.time, value: b.upper })));

        // Middle band (SMA)
        const middleBand = chart.addLineSeries({
            color: 'rgba(33, 150, 243, 0.5)',
            lineWidth: 1,
        });
        middleBand.setData(bands.map(b => ({ time: b.time, value: b.middle })));

        // Lower band
        const lowerBand = chart.addLineSeries({
            color: 'rgba(76, 175, 80, 0.5)',
            lineWidth: 1,
            lineStyle: 2, // Dashed
        });
        lowerBand.setData(bands.map(b => ({ time: b.time, value: b.lower })));

        return () => chart.remove();
    }, [priceData]);

    return <div ref={chartContainerRef} />;
};
```

### RSI (Relative Strength Index)

```jsx
// indicators/rsi.js
export const calculateRSI = (data, period = 14) => {
    const rsi = [];
    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI
    for (let i = period; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
        }

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        const rsiValue = 100 - (100 / (1 + rs));

        rsi.push({
            time: data[i].time,
            value: rsiValue
        });
    }

    return rsi;
};

// RSIChart.jsx
export const RSIChart = ({ priceData }) => {
    const chartContainerRef = useRef();
    const rsiChartRef = useRef();

    useEffect(() => {
        // Main price chart
        const priceChart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 300,
        });

        const priceSeries = priceChart.addCandlestickSeries();
        priceSeries.setData(priceData);

        // RSI chart (separate)
        const rsiChart = createChart(rsiChartRef.current, {
            width: rsiChartRef.current.clientWidth,
            height: 150,
            timeScale: {
                visible: false,
            },
        });

        // Sync time scales
        priceChart.timeScale().subscribeVisibleTimeRangeChange(() => {
            rsiChart.timeScale().setVisibleRange(
                priceChart.timeScale().getVisibleRange()
            );
        });

        rsiChart.timeScale().subscribeVisibleTimeRangeChange(() => {
            priceChart.timeScale().setVisibleRange(
                rsiChart.timeScale().getVisibleRange()
            );
        });

        // RSI line
        const rsiSeries = rsiChart.addLineSeries({
            color: '#6a1b9a',
            lineWidth: 2,
        });
        
        const rsiData = calculateRSI(priceData);
        rsiSeries.setData(rsiData);

        // Overbought/Oversold lines
        const overboughtLine = rsiChart.addLineSeries({
            color: 'rgba(255, 82, 82, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        overboughtLine.setData(rsiData.map(d => ({ time: d.time, value: 70 })));

        const oversoldLine = rsiChart.addLineSeries({
            color: 'rgba(76, 175, 80, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        oversoldLine.setData(rsiData.map(d => ({ time: d.time, value: 30 })));

        return () => {
            priceChart.remove();
            rsiChart.remove();
        };
    }, [priceData]);

    return (
        <div>
            <div ref={chartContainerRef} />
            <div style={{ marginTop: '10px' }}>
                <h4>RSI</h4>
                <div ref={rsiChartRef} />
            </div>
        </div>
    );
};
```

## MACD Indicator

```jsx
// indicators/macd.js
export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    // Calculate EMAs
    const calculateEMA = (data, period) => {
        const multiplier = 2 / (period + 1);
        const ema = [data[0].close];
        
        for (let i = 1; i < data.length; i++) {
            const value = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1];
            ema.push(value);
        }
        
        return ema;
    };

    const emaFast = calculateEMA(data, fastPeriod);
    const emaSlow = calculateEMA(data, slowPeriod);
    
    // Calculate MACD line
    const macdLine = [];
    for (let i = slowPeriod - 1; i < data.length; i++) {
        macdLine.push({
            time: data[i].time,
            value: emaFast[i] - emaSlow[i]
        });
    }
    
    // Calculate Signal line (EMA of MACD)
    const signalLine = [];
    const signalMultiplier = 2 / (signalPeriod + 1);
    signalLine.push(macdLine[0].value);
    
    for (let i = 1; i < macdLine.length; i++) {
        const value = (macdLine[i].value - signalLine[i - 1]) * signalMultiplier + signalLine[i - 1];
        signalLine.push(value);
    }
    
    // Calculate Histogram
    const histogram = [];
    for (let i = 0; i < macdLine.length; i++) {
        histogram.push({
            time: macdLine[i].time,
            value: macdLine[i].value - signalLine[i],
            color: macdLine[i].value - signalLine[i] >= 0 ? '#26a69a' : '#ef5350'
        });
    }
    
    return {
        macd: macdLine,
        signal: signalLine.map((value, i) => ({
            time: macdLine[i].time,
            value
        })),
        histogram
    };
};

// MACDChart.jsx
export const MACDChart = ({ priceData }) => {
    const priceChartRef = useRef();
    const macdChartRef = useRef();

    useEffect(() => {
        // Price chart
        const priceChart = createChart(priceChartRef.current, {
            width: priceChartRef.current.clientWidth,
            height: 350,
        });

        const candlestickSeries = priceChart.addCandlestickSeries();
        candlestickSeries.setData(priceData);

        // MACD chart
        const macdChart = createChart(macdChartRef.current, {
            width: macdChartRef.current.clientWidth,
            height: 200,
        });

        const { macd, signal, histogram } = calculateMACD(priceData);

        // MACD histogram
        const histogramSeries = macdChart.addHistogramSeries({
            priceFormat: {
                type: 'price',
                precision: 4,
            },
        });
        histogramSeries.setData(histogram);

        // MACD line
        const macdSeries = macdChart.addLineSeries({
            color: '#2962ff',
            lineWidth: 2,
        });
        macdSeries.setData(macd);

        // Signal line
        const signalSeries = macdChart.addLineSeries({
            color: '#ff6b6b',
            lineWidth: 2,
        });
        signalSeries.setData(signal);

        // Zero line
        const zeroLine = macdChart.addLineSeries({
            color: 'rgba(128, 128, 128, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        zeroLine.setData(macd.map(d => ({ time: d.time, value: 0 })));

        // Sync scrolling
        priceChart.timeScale().subscribeVisibleTimeRangeChange(() => {
            macdChart.timeScale().setVisibleRange(
                priceChart.timeScale().getVisibleRange()
            );
        });

        macdChart.timeScale().subscribeVisibleTimeRangeChange(() => {
            priceChart.timeScale().setVisibleRange(
                macdChart.timeScale().getVisibleRange()
            );
        });

        return () => {
            priceChart.remove();
            macdChart.remove();
        };
    }, [priceData]);

    return (
        <div>
            <div ref={priceChartRef} />
            <div style={{ marginTop: '10px' }}>
                <h4>MACD</h4>
                <div ref={macdChartRef} />
            </div>
        </div>
    );
};
```

## Synchronized Multiple Charts

```jsx
// SynchronizedCharts.jsx
export const SynchronizedCharts = ({ data }) => {
    const chartRefs = useRef([]);
    const charts = useRef([]);

    useEffect(() => {
        // Create multiple charts
        const chartConfigs = [
            { title: 'Price', height: 300, series: 'candlestick' },
            { title: 'Volume', height: 150, series: 'histogram' },
            { title: 'RSI', height: 150, series: 'line' }
        ];

        charts.current = chartConfigs.map((config, index) => {
            const chart = createChart(chartRefs.current[index], {
                width: chartRefs.current[index].clientWidth,
                height: config.height,
                timeScale: {
                    visible: index === chartConfigs.length - 1, // Only show on last chart
                },
            });

            // Add series based on type
            let series;
            switch (config.series) {
                case 'candlestick':
                    series = chart.addCandlestickSeries();
                    series.setData(data.candles);
                    break;
                case 'histogram':
                    series = chart.addHistogramSeries({
                        priceScaleId: '',
                        scaleMargins: { top: 0.1, bottom: 0 },
                    });
                    series.setData(data.volume);
                    break;
                case 'line':
                    series = chart.addLineSeries();
                    series.setData(calculateRSI(data.candles));
                    break;
            }

            return chart;
        });

        // Synchronize all charts
        const syncCharts = (sourceChart) => {
            const visibleRange = sourceChart.timeScale().getVisibleRange();
            charts.current.forEach(chart => {
                if (chart !== sourceChart) {
                    chart.timeScale().setVisibleRange(visibleRange);
                }
            });
        };

        // Subscribe to time range changes
        charts.current.forEach(chart => {
            chart.timeScale().subscribeVisibleTimeRangeChange(() => {
                syncCharts(chart);
            });
        });

        return () => {
            charts.current.forEach(chart => chart.remove());
        };
    }, [data]);

    return (
        <div className="synchronized-charts">
            <div ref={el => chartRefs.current[0] = el}>
                <h4>Price</h4>
            </div>
            <div ref={el => chartRefs.current[1] = el}>
                <h4>Volume</h4>
            </div>
            <div ref={el => chartRefs.current[2] = el}>
                <h4>RSI</h4>
            </div>
        </div>
    );
};
```

## Dynamic Series Management

```jsx
// DynamicIndicators.jsx
export const DynamicIndicators = ({ priceData }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const seriesMap = useRef(new Map());
    const [indicators, setIndicators] = useState([]);

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        // Main price series
        const priceSeries = chart.current.addCandlestickSeries();
        priceSeries.setData(priceData);
        seriesMap.current.set('price', priceSeries);

        return () => chart.current.remove();
    }, [priceData]);

    const addIndicator = (type, params = {}) => {
        let data, series;

        switch (type) {
            case 'sma':
                data = calculateSMA(priceData, params.period || 20);
                series = chart.current.addLineSeries({
                    color: params.color || '#2962ff',
                    lineWidth: 2,
                });
                break;
            
            case 'ema':
                data = calculateEMA(priceData, params.period || 20);
                series = chart.current.addLineSeries({
                    color: params.color || '#ff6b6b',
                    lineWidth: 2,
                });
                break;
            
            case 'volume':
                data = priceData.map(d => ({
                    time: d.time,
                    value: d.volume,
                    color: d.close >= d.open ? '#26a69a' : '#ef5350'
                }));
                series = chart.current.addHistogramSeries({
                    priceScaleId: '',
                    scaleMargins: { top: 0.8, bottom: 0 },
                });
                break;
        }

        if (series && data) {
            series.setData(data);
            const id = `${type}-${Date.now()}`;
            seriesMap.current.set(id, series);
            setIndicators(prev => [...prev, { id, type, params }]);
        }
    };

    const removeIndicator = (id) => {
        const series = seriesMap.current.get(id);
        if (series) {
            chart.current.removeSeries(series);
            seriesMap.current.delete(id);
            setIndicators(prev => prev.filter(ind => ind.id !== id));
        }
    };

    return (
        <div>
            <div className="controls">
                <button onClick={() => addIndicator('sma', { period: 20, color: '#2962ff' })}>
                    Add SMA(20)
                </button>
                <button onClick={() => addIndicator('sma', { period: 50, color: '#ff6b6b' })}>
                    Add SMA(50)
                </button>
                <button onClick={() => addIndicator('ema', { period: 20, color: '#4ecdc4' })}>
                    Add EMA(20)
                </button>
                <button onClick={() => addIndicator('volume')}>
                    Add Volume
                </button>
            </div>
            
            <div className="active-indicators">
                {indicators.map(ind => (
                    <div key={ind.id} className="indicator-item">
                        <span>{ind.type.toUpperCase()}({ind.params.period || ''})</span>
                        <button onClick={() => removeIndicator(ind.id)}>Remove</button>
                    </div>
                ))}
            </div>
            
            <div ref={chartContainerRef} />
        </div>
    );
};
```

## Comparison Charts

```jsx
// ComparisonChart.jsx
export const ComparisonChart = ({ symbols, data }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            rightPriceScale: {
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
        });

        const colors = ['#2962ff', '#ff6b6b', '#4ecdc4', '#ffd93d', '#6a1b9a'];

        symbols.forEach((symbol, index) => {
            // Normalize data to percentage change from first value
            const symbolData = data[symbol];
            const firstValue = symbolData[0].value;
            const normalizedData = symbolData.map(d => ({
                time: d.time,
                value: ((d.value - firstValue) / firstValue) * 100
            }));

            const series = chart.current.addLineSeries({
                color: colors[index % colors.length],
                lineWidth: 2,
                title: symbol,
                priceFormat: {
                    type: 'custom',
                    formatter: price => `${price.toFixed(2)}%`,
                },
            });
            series.setData(normalizedData);
        });

        // Add zero line
        const zeroLine = chart.current.addLineSeries({
            color: 'rgba(128, 128, 128, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        
        const timePoints = data[symbols[0]].map(d => d.time);
        zeroLine.setData(timePoints.map(time => ({ time, value: 0 })));

        return () => chart.remove();
    }, [symbols, data]);

    return (
        <div>
            <h3>Performance Comparison</h3>
            <div className="legend">
                {symbols.map((symbol, index) => (
                    <span key={symbol} style={{ 
                        color: ['#2962ff', '#ff6b6b', '#4ecdc4', '#ffd93d', '#6a1b9a'][index % 5] 
                    }}>
                        {symbol}
                    </span>
                ))}
            </div>
            <div ref={chartContainerRef} />
        </div>
    );
};
```

## Best Practices

1. **Performance**: Use separate price scales for indicators that have different value ranges
2. **Synchronization**: Keep multiple charts in sync using timeScale subscriptions
3. **Memory**: Remove series and charts properly to prevent memory leaks
4. **Calculation**: Pre-calculate indicators when possible, avoid recalculating on each render
5. **Visualization**: Use appropriate series types for different data (histogram for volume, line for indicators)
6. **User Experience**: Provide controls to add/remove indicators dynamically
7. **Responsiveness**: Update chart dimensions on window resize

## Next Steps

- Implement more advanced indicators (Stochastic, ADX, Ichimoku)
- Add custom drawing tools
- Create indicator parameter adjustment UI
- Build backtesting visualization
- Add pattern recognition overlays