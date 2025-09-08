# Advanced TradingView Lightweight Charts in React

## Overview
This tutorial covers advanced patterns for implementing TradingView Lightweight Charts in React, including component composition, dynamic series management, and real-time updates.

## Advanced Component Architecture

### Chart Context Provider

```jsx
// ChartContext.jsx
import React, { createContext, useContext, useRef, useEffect } from 'react';
import { createChart } from 'lightweight-charts';

const ChartContext = createContext();

export const useChart = () => {
    const context = useContext(ChartContext);
    if (!context) {
        throw new Error('useChart must be used within ChartProvider');
    }
    return context;
};

export const ChartProvider = ({ children, options = {} }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const seriesRef = useRef(new Map());

    useEffect(() => {
        if (chartContainerRef.current) {
            chartRef.current = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: 400,
                ...options
            });

            const handleResize = () => {
                if (chartRef.current && chartContainerRef.current) {
                    chartRef.current.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                    });
                }
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                if (chartRef.current) {
                    chartRef.current.remove();
                    chartRef.current = null;
                }
            };
        }
    }, []);

    const value = {
        chart: chartRef.current,
        container: chartContainerRef.current,
        series: seriesRef.current,
        addSeries: (type, options, id) => {
            if (!chartRef.current) return null;
            
            let series;
            switch (type) {
                case 'line':
                    series = chartRef.current.addLineSeries(options);
                    break;
                case 'area':
                    series = chartRef.current.addAreaSeries(options);
                    break;
                case 'candlestick':
                    series = chartRef.current.addCandlestickSeries(options);
                    break;
                case 'bar':
                    series = chartRef.current.addBarSeries(options);
                    break;
                case 'histogram':
                    series = chartRef.current.addHistogramSeries(options);
                    break;
                default:
                    throw new Error(`Unknown series type: ${type}`);
            }
            
            if (id) {
                seriesRef.current.set(id, series);
            }
            
            return series;
        },
        removeSeries: (id) => {
            const series = seriesRef.current.get(id);
            if (series && chartRef.current) {
                chartRef.current.removeSeries(series);
                seriesRef.current.delete(id);
            }
        }
    };

    return (
        <ChartContext.Provider value={value}>
            <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }}>
                {children}
            </div>
        </ChartContext.Provider>
    );
};
```

### Dynamic Series Component

```jsx
// Series.jsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useChart } from './ChartContext';

export const Series = forwardRef(({ 
    type = 'line', 
    data = [], 
    options = {},
    id,
    onSeriesCreated 
}, ref) => {
    const { addSeries, removeSeries, chart } = useChart();
    const seriesRef = useRef();

    useEffect(() => {
        if (chart) {
            seriesRef.current = addSeries(type, options, id);
            
            if (seriesRef.current && data.length > 0) {
                seriesRef.current.setData(data);
            }

            if (onSeriesCreated && seriesRef.current) {
                onSeriesCreated(seriesRef.current);
            }

            return () => {
                if (id) {
                    removeSeries(id);
                }
            };
        }
    }, [chart, type, id]);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            seriesRef.current.setData(data);
        }
    }, [data]);

    useImperativeHandle(ref, () => ({
        update: (newData) => {
            if (seriesRef.current) {
                seriesRef.current.update(newData);
            }
        },
        setData: (newData) => {
            if (seriesRef.current) {
                seriesRef.current.setData(newData);
            }
        },
        series: () => seriesRef.current
    }));

    return null;
});
```

## Real-time Data Management

### WebSocket Integration

```jsx
// useWebSocketData.js
import { useState, useEffect, useRef } from 'react';

export const useWebSocketData = (url, symbol) => {
    const [data, setData] = useState([]);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            ws.current.send(JSON.stringify({
                type: 'subscribe',
                symbol: symbol
            }));
        };

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'update') {
                setData(prevData => {
                    const newPoint = {
                        time: message.timestamp,
                        value: message.price
                    };
                    
                    // Update last point or add new one
                    const lastIndex = prevData.length - 1;
                    if (lastIndex >= 0 && prevData[lastIndex].time === newPoint.time) {
                        return [...prevData.slice(0, lastIndex), newPoint];
                    }
                    return [...prevData, newPoint];
                });
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [url, symbol]);

    return data;
};
```

### Real-time Chart Component

```jsx
// RealTimeChart.jsx
import React, { useRef, useEffect } from 'react';
import { ChartProvider } from './ChartContext';
import { Series } from './Series';
import { useWebSocketData } from './useWebSocketData';

export const RealTimeChart = ({ symbol, wsUrl }) => {
    const seriesRef = useRef();
    const data = useWebSocketData(wsUrl, symbol);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            const lastDataPoint = data[data.length - 1];
            seriesRef.current.update(lastDataPoint);
        }
    }, [data]);

    return (
        <ChartProvider
            options={{
                layout: {
                    background: { type: 'solid', color: '#1e1e1e' },
                    textColor: '#d1d4dc',
                },
                grid: {
                    vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
                    horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
                },
            }}
        >
            <Series
                ref={seriesRef}
                type="line"
                data={data}
                options={{
                    color: '#2962ff',
                    lineWidth: 2,
                }}
                id="realtime-series"
            />
        </ChartProvider>
    );
};
```

## Multiple Series Management

### Multi-Series Chart

```jsx
// MultiSeriesChart.jsx
import React, { useState } from 'react';
import { ChartProvider } from './ChartContext';
import { Series } from './Series';

const generateData = (baseValue = 100, count = 100) => {
    const data = [];
    let time = new Date('2023-01-01').getTime() / 1000;
    let value = baseValue;

    for (let i = 0; i < count; i++) {
        value += (Math.random() - 0.5) * 2;
        data.push({
            time: time,
            value: value
        });
        time += 86400; // Add one day
    }

    return data;
};

export const MultiSeriesChart = () => {
    const [series, setSeries] = useState([
        {
            id: 'series-1',
            type: 'line',
            data: generateData(100),
            options: { color: '#2962ff', lineWidth: 2 },
            visible: true
        }
    ]);

    const addSeries = () => {
        const newSeries = {
            id: `series-${series.length + 1}`,
            type: Math.random() > 0.5 ? 'line' : 'area',
            data: generateData(100 + series.length * 20),
            options: {
                color: `hsl(${series.length * 60}, 70%, 50%)`,
                lineWidth: 2
            },
            visible: true
        };
        setSeries([...series, newSeries]);
    };

    const toggleSeries = (id) => {
        setSeries(series.map(s => 
            s.id === id ? { ...s, visible: !s.visible } : s
        ));
    };

    const removeSeries = (id) => {
        setSeries(series.filter(s => s.id !== id));
    };

    return (
        <div>
            <div className="controls">
                <button onClick={addSeries}>Add Series</button>
                {series.map(s => (
                    <div key={s.id} className="series-control">
                        <label>
                            <input
                                type="checkbox"
                                checked={s.visible}
                                onChange={() => toggleSeries(s.id)}
                            />
                            {s.id}
                        </label>
                        <button onClick={() => removeSeries(s.id)}>Remove</button>
                    </div>
                ))}
            </div>
            
            <ChartProvider>
                {series.filter(s => s.visible).map(s => (
                    <Series
                        key={s.id}
                        id={s.id}
                        type={s.type}
                        data={s.data}
                        options={s.options}
                    />
                ))}
            </ChartProvider>
        </div>
    );
};
```

## Interactive Features

### Crosshair and Tooltip

```jsx
// InteractiveChart.jsx
import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';

export const InteractiveChart = ({ data }) => {
    const chartContainerRef = useRef();
    const tooltipRef = useRef();
    const [tooltipContent, setTooltipContent] = useState(null);

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    width: 1,
                    color: 'rgba(224, 227, 235, 0.1)',
                    style: 0,
                },
                horzLine: {
                    visible: true,
                    labelVisible: true,
                },
            },
        });

        const series = chart.addAreaSeries({
            topColor: 'rgba(33, 150, 243, 0.56)',
            bottomColor: 'rgba(33, 150, 243, 0.04)',
            lineColor: 'rgba(33, 150, 243, 1)',
            lineWidth: 2,
        });

        series.setData(data);

        // Crosshair move handler
        chart.subscribeCrosshairMove((param) => {
            if (!param.time || param.seriesData.size === 0) {
                setTooltipContent(null);
                return;
            }

            const seriesData = param.seriesData.get(series);
            if (!seriesData) {
                setTooltipContent(null);
                return;
            }

            const coordinate = series.priceToCoordinate(seriesData.value);
            if (coordinate === null) {
                return;
            }

            setTooltipContent({
                x: param.point.x,
                y: coordinate,
                time: param.time,
                value: seriesData.value.toFixed(2),
            });
        });

        // Click handler
        chart.subscribeClick((param) => {
            if (param.time) {
                const seriesData = param.seriesData.get(series);
                if (seriesData) {
                    alert(`Clicked at ${param.time}: ${seriesData.value.toFixed(2)}`);
                }
            }
        });

        return () => {
            chart.remove();
        };
    }, [data]);

    return (
        <div style={{ position: 'relative' }}>
            <div ref={chartContainerRef} />
            {tooltipContent && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'absolute',
                        left: tooltipContent.x + 'px',
                        top: tooltipContent.y + 'px',
                        transform: 'translate(-50%, -100%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        zIndex: 1000,
                    }}
                >
                    <div>Time: {tooltipContent.time}</div>
                    <div>Value: {tooltipContent.value}</div>
                </div>
            )}
        </div>
    );
};
```

### Custom Markers

```jsx
// ChartWithMarkers.jsx
export const ChartWithMarkers = ({ data, markers = [] }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        const series = chart.addLineSeries({
            color: '#2962ff',
            lineWidth: 2,
        });

        series.setData(data);

        // Add markers
        const chartMarkers = markers.map(marker => ({
            time: marker.time,
            position: marker.type === 'buy' ? 'belowBar' : 'aboveBar',
            color: marker.type === 'buy' ? '#2196F3' : '#e91e63',
            shape: marker.type === 'buy' ? 'arrowUp' : 'arrowDown',
            text: marker.text || marker.type,
        }));

        series.setMarkers(chartMarkers);

        return () => {
            chart.remove();
        };
    }, [data, markers]);

    return <div ref={chartContainerRef} />;
};
```

## Price Lines and Annotations

### Price Lines

```jsx
// ChartWithPriceLines.jsx
export const ChartWithPriceLines = ({ data, priceLines = [] }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        const series = chart.addLineSeries({
            color: '#2962ff',
        });

        series.setData(data);

        // Add price lines
        priceLines.forEach(priceLine => {
            series.createPriceLine({
                price: priceLine.price,
                color: priceLine.color || '#ff0000',
                lineWidth: priceLine.lineWidth || 1,
                lineStyle: priceLine.lineStyle || 2, // Dashed
                axisLabelVisible: true,
                title: priceLine.title || '',
            });
        });

        return () => {
            chart.remove();
        };
    }, [data, priceLines]);

    return <div ref={chartContainerRef} />;
};
```

## Performance Optimization

### Virtualized Data Loading

```jsx
// VirtualizedChart.jsx
export const VirtualizedChart = ({ loadData }) => {
    const chartContainerRef = useRef();
    const seriesRef = useRef();
    const [visibleRange, setVisibleRange] = useState(null);

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        seriesRef.current = chart.addLineSeries();

        // Subscribe to visible range changes
        chart.timeScale().subscribeVisibleTimeRangeChange((newVisibleRange) => {
            setVisibleRange(newVisibleRange);
        });

        return () => {
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (visibleRange && seriesRef.current) {
            // Load only visible data
            loadData(visibleRange.from, visibleRange.to).then(data => {
                seriesRef.current.setData(data);
            });
        }
    }, [visibleRange, loadData]);

    return <div ref={chartContainerRef} />;
};
```

### Debounced Updates

```jsx
// DebouncedChart.jsx
import { useMemo } from 'react';
import { debounce } from 'lodash';

export const DebouncedChart = ({ data, updateInterval = 100 }) => {
    const chartContainerRef = useRef();
    const seriesRef = useRef();

    const debouncedUpdate = useMemo(
        () => debounce((newData) => {
            if (seriesRef.current) {
                seriesRef.current.update(newData);
            }
        }, updateInterval),
        [updateInterval]
    );

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        seriesRef.current = chart.addLineSeries();
        seriesRef.current.setData(data);

        return () => {
            debouncedUpdate.cancel();
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (data.length > 0) {
            debouncedUpdate(data[data.length - 1]);
        }
    }, [data, debouncedUpdate]);

    return <div ref={chartContainerRef} />;
};
```

## Theme Management

### Theme Provider

```jsx
// ThemeProvider.jsx
const themes = {
    light: {
        layout: {
            background: { type: 'solid', color: '#FFFFFF' },
            textColor: '#191919',
        },
        grid: {
            vertLines: { color: '#e1e1e1' },
            horzLines: { color: '#e1e1e1' },
        },
    },
    dark: {
        layout: {
            background: { type: 'solid', color: '#1e1e1e' },
            textColor: '#d1d4dc',
        },
        grid: {
            vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
            horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
        },
    },
};

export const ThemedChart = ({ data, theme = 'light' }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            ...themes[theme],
        });

        const series = chart.addAreaSeries();
        series.setData(data);

        return () => {
            chart.remove();
        };
    }, [data, theme]);

    return <div ref={chartContainerRef} />;
};
```

## Best Practices

1. **Component Composition**: Use context for chart state management
2. **Performance**: Debounce frequent updates and virtualize large datasets
3. **Memory Management**: Always cleanup chart instances and subscriptions
4. **Error Boundaries**: Wrap charts in error boundaries for production
5. **Accessibility**: Add keyboard navigation and ARIA labels
6. **Testing**: Use refs to expose chart API for testing

## Next Steps

- Implement technical indicators
- Add drawing tools
- Create custom overlays
- Integrate with state management (Redux/MobX)
- Build a complete trading interface