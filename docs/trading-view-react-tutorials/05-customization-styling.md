# Customization and Styling in TradingView Lightweight Charts

## Overview
This guide covers comprehensive customization options for TradingView Lightweight Charts, including themes, layouts, colors, and interactive features.

## Chart Layout Customization

### Basic Layout Options

```jsx
export const CustomLayoutChart = ({ data }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
                background: {
                    type: ColorType.Solid,
                    color: '#1e222d',
                },
                textColor: '#d1d4dc',
                fontSize: 12,
                fontFamily: "'Roboto', sans-serif",
            },
            grid: {
                vertLines: {
                    color: 'rgba(42, 46, 57, 0.6)',
                    style: LineStyle.Dotted,
                    visible: true,
                },
                horzLines: {
                    color: 'rgba(42, 46, 57, 0.6)',
                    style: LineStyle.Dotted,
                    visible: true,
                },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    width: 1,
                    color: 'rgba(224, 227, 235, 0.1)',
                    style: LineStyle.Solid,
                    labelBackgroundColor: '#2962ff',
                },
                horzLine: {
                    visible: true,
                    labelVisible: true,
                    labelBackgroundColor: '#2962ff',
                },
            },
            timeScale: {
                borderColor: '#485c7b',
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time, tickMarkType, locale) => {
                    const date = new Date(time * 1000);
                    switch (tickMarkType) {
                        case TickMarkType.Year:
                            return date.getFullYear();
                        case TickMarkType.Month:
                            return date.toLocaleString('en', { month: 'short' });
                        case TickMarkType.DayOfMonth:
                            return date.getDate();
                        case TickMarkType.Time:
                            return date.toLocaleTimeString('en', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                        case TickMarkType.TimeWithSeconds:
                            return date.toLocaleTimeString('en');
                    }
                },
            },
            rightPriceScale: {
                borderColor: '#485c7b',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
                mode: PriceScaleMode.Normal,
                alignLabels: true,
                borderVisible: true,
                entire: true,
            },
            leftPriceScale: {
                visible: false,
                borderColor: '#485c7b',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            localization: {
                locale: 'en-US',
                dateFormat: 'dd MMM \'yy',
                priceFormatter: price => {
                    if (price < 1) {
                        return price.toFixed(4);
                    }
                    return price.toFixed(2);
                },
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                axisPressedMouseMove: {
                    time: true,
                    price: true,
                },
                mouseWheel: true,
                pinch: true,
            },
        });

        const series = chart.addCandlestickSeries();
        series.setData(data);

        return () => chart.remove();
    }, [data]);

    return <div ref={chartContainerRef} />;
};
```

## Theme Management

### Theme Provider

```jsx
// themes.js
export const themes = {
    light: {
        chart: {
            layout: {
                background: { type: ColorType.Solid, color: '#ffffff' },
                textColor: '#191919',
            },
            grid: {
                vertLines: { color: '#e0e0e0' },
                horzLines: { color: '#e0e0e0' },
            },
            crosshair: {
                vertLine: { labelBackgroundColor: '#4285f4' },
                horzLine: { labelBackgroundColor: '#4285f4' },
            },
        },
        candlestick: {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderUpColor: '#26a69a',
            borderDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        },
        volume: {
            upColor: 'rgba(38, 166, 154, 0.5)',
            downColor: 'rgba(239, 83, 80, 0.5)',
        },
    },
    dark: {
        chart: {
            layout: {
                background: { type: ColorType.Solid, color: '#131722' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
            },
            crosshair: {
                vertLine: { labelBackgroundColor: '#2962ff' },
                horzLine: { labelBackgroundColor: '#2962ff' },
            },
        },
        candlestick: {
            upColor: '#089981',
            downColor: '#f23645',
            borderUpColor: '#089981',
            borderDownColor: '#f23645',
            wickUpColor: '#089981',
            wickDownColor: '#f23645',
        },
        volume: {
            upColor: 'rgba(8, 153, 129, 0.5)',
            downColor: 'rgba(242, 54, 69, 0.5)',
        },
    },
    tradingview: {
        chart: {
            layout: {
                background: { type: ColorType.Solid, color: '#1e222d' },
                textColor: '#9598a1',
            },
            grid: {
                vertLines: { color: '#363c4e' },
                horzLines: { color: '#363c4e' },
            },
        },
        candlestick: {
            upColor: '#22ab94',
            downColor: '#f7525f',
            borderVisible: false,
            wickUpColor: '#22ab94',
            wickDownColor: '#f7525f',
        },
    },
};

// ThemedChart.jsx
export const ThemedChart = ({ data, themeName = 'dark' }) => {
    const chartContainerRef = useRef();
    const theme = themes[themeName];

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            ...theme.chart,
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        const candlestickSeries = chart.addCandlestickSeries(theme.candlestick);
        candlestickSeries.setData(data.candles);

        if (data.volume) {
            const volumeSeries = chart.addHistogramSeries({
                ...theme.volume,
                priceFormat: { type: 'volume' },
                priceScaleId: '',
                scaleMargins: { top: 0.8, bottom: 0 },
            });
            volumeSeries.setData(data.volume);
        }

        return () => chart.remove();
    }, [data, theme]);

    return <div ref={chartContainerRef} />;
};
```

## Custom Series Styling

### Gradient Areas

```jsx
export const GradientAreaChart = ({ data }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        // Create gradient area series
        const areaSeries = chart.addAreaSeries({
            lineColor: '#2962ff',
            lineWidth: 2,
            topColor: 'rgba(41, 98, 255, 0.56)',
            bottomColor: 'rgba(41, 98, 255, 0.04)',
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 6,
            crosshairMarkerBorderColor: '#ffffff',
            crosshairMarkerBackgroundColor: '#2962ff',
            priceLineVisible: true,
            lastValueVisible: true,
            priceLineWidth: 1,
            priceLineColor: '#2962ff',
            priceLineStyle: LineStyle.Dashed,
        });

        areaSeries.setData(data);

        // Add markers for significant points
        const markers = data
            .filter((d, i) => {
                // Mark local maxima and minima
                if (i === 0 || i === data.length - 1) return false;
                const prev = data[i - 1].value;
                const curr = d.value;
                const next = data[i + 1].value;
                return (curr > prev && curr > next) || (curr < prev && curr < next);
            })
            .map(d => ({
                time: d.time,
                position: d.value > data[0].value ? 'aboveBar' : 'belowBar',
                color: d.value > data[0].value ? '#26a69a' : '#ef5350',
                shape: d.value > data[0].value ? 'arrowDown' : 'arrowUp',
                text: d.value.toFixed(2),
            }));

        areaSeries.setMarkers(markers);

        return () => chart.remove();
    }, [data]);

    return <div ref={chartContainerRef} />;
};
```

### Custom Candlestick Patterns

```jsx
export const PatternHighlightChart = ({ data }) => {
    const chartContainerRef = useRef();

    const detectPatterns = (candles) => {
        const patterns = [];
        
        for (let i = 1; i < candles.length - 1; i++) {
            const prev = candles[i - 1];
            const curr = candles[i];
            const next = candles[i + 1];
            
            // Doji pattern
            if (Math.abs(curr.close - curr.open) < (curr.high - curr.low) * 0.1) {
                patterns.push({
                    time: curr.time,
                    position: 'aboveBar',
                    color: '#ffd700',
                    shape: 'circle',
                    text: 'Doji',
                });
            }
            
            // Hammer pattern
            const bodySize = Math.abs(curr.close - curr.open);
            const lowerWick = Math.min(curr.open, curr.close) - curr.low;
            const upperWick = curr.high - Math.max(curr.open, curr.close);
            
            if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5) {
                patterns.push({
                    time: curr.time,
                    position: 'belowBar',
                    color: '#26a69a',
                    shape: 'arrowUp',
                    text: 'Hammer',
                });
            }
            
            // Engulfing pattern
            if (prev.close < prev.open && curr.close > curr.open &&
                curr.open <= prev.close && curr.close >= prev.open) {
                patterns.push({
                    time: curr.time,
                    position: 'belowBar',
                    color: '#4caf50',
                    shape: 'arrowUp',
                    text: 'Bullish Engulfing',
                });
            }
        }
        
        return patterns;
    };

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: true,
            wickVisible: true,
        });

        candlestickSeries.setData(data);
        
        // Detect and mark patterns
        const patterns = detectPatterns(data);
        candlestickSeries.setMarkers(patterns);

        return () => chart.remove();
    }, [data]);

    return <div ref={chartContainerRef} />;
};
```

## Interactive Features

### Custom Tooltips

```jsx
export const TooltipChart = ({ data }) => {
    const chartContainerRef = useRef();
    const [tooltip, setTooltip] = useState(null);

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            crosshair: {
                mode: CrosshairMode.Magnet,
            },
        });

        const candlestickSeries = chart.addCandlestickSeries();
        candlestickSeries.setData(data);

        chart.subscribeCrosshairMove((param) => {
            if (!param.time || param.seriesData.size === 0) {
                setTooltip(null);
                return;
            }

            const candleData = param.seriesData.get(candlestickSeries);
            if (!candleData) return;

            const coordinate = candlestickSeries.priceToCoordinate(candleData.close);
            if (coordinate === null) return;

            setTooltip({
                x: param.point.x,
                y: coordinate,
                time: param.time,
                open: candleData.open.toFixed(2),
                high: candleData.high.toFixed(2),
                low: candleData.low.toFixed(2),
                close: candleData.close.toFixed(2),
                change: ((candleData.close - candleData.open) / candleData.open * 100).toFixed(2),
            });
        });

        return () => chart.remove();
    }, [data]);

    return (
        <div style={{ position: 'relative' }}>
            <div ref={chartContainerRef} />
            {tooltip && (
                <div
                    className="custom-tooltip"
                    style={{
                        position: 'absolute',
                        left: tooltip.x + 'px',
                        top: tooltip.y + 'px',
                        transform: 'translate(10px, -50%)',
                        background: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '5px',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        minWidth: '150px',
                    }}
                >
                    <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
                        {new Date(tooltip.time * 1000).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                        <span>Open:</span>
                        <span>{tooltip.open}</span>
                        <span>High:</span>
                        <span>{tooltip.high}</span>
                        <span>Low:</span>
                        <span>{tooltip.low}</span>
                        <span>Close:</span>
                        <span>{tooltip.close}</span>
                        <span>Change:</span>
                        <span style={{ 
                            color: parseFloat(tooltip.change) >= 0 ? '#26a69a' : '#ef5350' 
                        }}>
                            {tooltip.change}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
```

### Custom Legend

```jsx
export const LegendChart = ({ data, indicators }) => {
    const chartContainerRef = useRef();
    const [legendData, setLegendData] = useState({});

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        const candlestickSeries = chart.addCandlestickSeries();
        candlestickSeries.setData(data);

        // Add indicators
        const indicatorSeries = indicators.map(indicator => {
            const series = chart.addLineSeries({
                color: indicator.color,
                lineWidth: 2,
            });
            series.setData(indicator.data);
            return { ...indicator, series };
        });

        // Update legend on crosshair move
        chart.subscribeCrosshairMove((param) => {
            if (!param.time) {
                setLegendData({});
                return;
            }

            const candle = param.seriesData.get(candlestickSeries);
            const newLegendData = {
                time: param.time,
                ohlc: candle ? {
                    o: candle.open.toFixed(2),
                    h: candle.high.toFixed(2),
                    l: candle.low.toFixed(2),
                    c: candle.close.toFixed(2),
                } : null,
                indicators: {},
            };

            indicatorSeries.forEach(ind => {
                const value = param.seriesData.get(ind.series);
                if (value) {
                    newLegendData.indicators[ind.name] = value.value.toFixed(2);
                }
            });

            setLegendData(newLegendData);
        });

        return () => chart.remove();
    }, [data, indicators]);

    return (
        <div>
            <div className="chart-legend" style={{
                padding: '10px',
                background: '#f0f0f0',
                borderRadius: '5px',
                marginBottom: '10px',
                fontSize: '14px',
                fontFamily: 'monospace',
            }}>
                {legendData.time && (
                    <div>
                        <strong>
                            {new Date(legendData.time * 1000).toLocaleString()}
                        </strong>
                        {legendData.ohlc && (
                            <span style={{ marginLeft: '20px' }}>
                                O: {legendData.ohlc.o} H: {legendData.ohlc.h} 
                                L: {legendData.ohlc.l} C: {legendData.ohlc.c}
                            </span>
                        )}
                        {Object.entries(legendData.indicators).map(([name, value]) => (
                            <span key={name} style={{ marginLeft: '20px' }}>
                                {name}: {value}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <div ref={chartContainerRef} />
        </div>
    );
};
```

## Watermarks

```jsx
export const WatermarkChart = ({ data, watermarkText = 'DEMO' }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            watermark: {
                visible: true,
                fontSize: 48,
                horzAlign: 'center',
                vertAlign: 'center',
                color: 'rgba(171, 171, 171, 0.3)',
                text: watermarkText,
            },
        });

        const series = chart.addCandlestickSeries();
        series.setData(data);

        return () => chart.remove();
    }, [data, watermarkText]);

    return <div ref={chartContainerRef} />;
};
```

## Mobile Responsive Design

```jsx
export const MobileResponsiveChart = ({ data }) => {
    const chartContainerRef = useRef();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: isMobile ? 250 : 400,
            layout: {
                fontSize: isMobile ? 10 : 12,
            },
            grid: {
                vertLines: { visible: !isMobile },
                horzLines: { visible: true },
            },
            timeScale: {
                barSpacing: isMobile ? 3 : 6,
                rightOffset: isMobile ? 2 : 5,
                fixLeftEdge: true,
                fixRightEdge: true,
                lockVisibleTimeRangeOnResize: true,
            },
            rightPriceScale: {
                scaleMargins: {
                    top: 0.1,
                    bottom: isMobile ? 0.1 : 0.2,
                },
            },
            handleScroll: {
                vertTouchDrag: isMobile,
                horzTouchDrag: true,
            },
            handleScale: {
                pinch: true,
                axisPressedMouseMove: !isMobile,
            },
        });

        const series = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: !isMobile,
            wickVisible: !isMobile,
        });
        series.setData(data);

        return () => chart.remove();
    }, [data, isMobile]);

    return <div ref={chartContainerRef} />;
};
```

## Complete Customizable Trading Interface

```jsx
export const TradingInterface = ({ symbol, data }) => {
    const [theme, setTheme] = useState('dark');
    const [chartType, setChartType] = useState('candlestick');
    const [timeframe, setTimeframe] = useState('1D');
    const [showVolume, setShowVolume] = useState(true);
    const [indicators, setIndicators] = useState([]);
    
    const chartContainerRef = useRef();
    const chart = useRef();

    useEffect(() => {
        const currentTheme = themes[theme];
        
        chart.current = createChart(chartContainerRef.current, {
            ...currentTheme.chart,
            width: chartContainerRef.current.clientWidth,
            height: 500,
        });

        // Add main series based on chart type
        let mainSeries;
        switch (chartType) {
            case 'candlestick':
                mainSeries = chart.current.addCandlestickSeries(currentTheme.candlestick);
                break;
            case 'line':
                mainSeries = chart.current.addLineSeries({
                    color: currentTheme.candlestick.upColor,
                    lineWidth: 2,
                });
                break;
            case 'area':
                mainSeries = chart.current.addAreaSeries({
                    lineColor: currentTheme.candlestick.upColor,
                    topColor: currentTheme.candlestick.upColor + '56',
                    bottomColor: currentTheme.candlestick.upColor + '04',
                });
                break;
        }
        
        mainSeries.setData(data[timeframe]);

        // Add volume if enabled
        if (showVolume) {
            const volumeSeries = chart.current.addHistogramSeries({
                ...currentTheme.volume,
                priceFormat: { type: 'volume' },
                priceScaleId: '',
                scaleMargins: { top: 0.8, bottom: 0 },
            });
            volumeSeries.setData(data[timeframe].map(d => ({
                time: d.time,
                value: d.volume,
                color: d.close >= d.open 
                    ? currentTheme.volume.upColor 
                    : currentTheme.volume.downColor
            })));
        }

        return () => chart.current.remove();
    }, [theme, chartType, timeframe, showVolume, data]);

    return (
        <div className="trading-interface">
            <div className="controls-bar">
                <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="tradingview">TradingView</option>
                </select>
                
                <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                    <option value="candlestick">Candlestick</option>
                    <option value="line">Line</option>
                    <option value="area">Area</option>
                </select>
                
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                    <option value="1m">1m</option>
                    <option value="5m">5m</option>
                    <option value="1h">1h</option>
                    <option value="1D">1D</option>
                </select>
                
                <label>
                    <input
                        type="checkbox"
                        checked={showVolume}
                        onChange={(e) => setShowVolume(e.target.checked)}
                    />
                    Volume
                </label>
            </div>
            
            <div ref={chartContainerRef} />
        </div>
    );
};
```

## Best Practices

1. **Consistent Theming**: Use a theme provider for consistent styling across charts
2. **Responsive Design**: Adapt chart settings based on screen size
3. **Performance**: Avoid unnecessary re-renders by memoizing chart options
4. **Accessibility**: Provide keyboard navigation and screen reader support
5. **Customization**: Make styling configurable through props
6. **Mobile Optimization**: Adjust interactions and visuals for touch devices

## Next Steps

- Implement custom drawing tools
- Add chart annotations
- Create custom chart types
- Build advanced technical analysis tools
- Integrate with charting libraries for additional features