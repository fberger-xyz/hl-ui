# Real-Time Data Updates in TradingView Lightweight Charts

## Overview
This guide covers implementing real-time data updates in TradingView Lightweight Charts, including WebSocket integration, streaming data patterns, and performance optimization.

## Update Methods

### Series Update vs SetData

```jsx
// ❌ Inefficient: Replaces all data
series.setData(allData);

// ✅ Efficient: Updates only the latest point
series.update(latestDataPoint);
```

## Basic Real-Time Updates

### Simple Update Pattern

```jsx
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export const RealTimeChart = () => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const series = useRef();

    useEffect(() => {
        // Initialize chart
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        series.current = chart.current.addLineSeries();

        // Initial data
        const initialData = generateInitialData();
        series.current.setData(initialData);

        // Start real-time updates
        const interval = setInterval(() => {
            const lastData = initialData[initialData.length - 1];
            const newData = {
                time: Math.floor(Date.now() / 1000),
                value: lastData.value + (Math.random() - 0.5) * 2
            };
            
            // Update the chart with new data
            series.current.update(newData);
        }, 1000);

        return () => {
            clearInterval(interval);
            chart.current.remove();
        };
    }, []);

    return <div ref={chartContainerRef} />;
};
```

## WebSocket Integration

### WebSocket Hook

```jsx
// useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
    const [data, setData] = useState([]);
    const [status, setStatus] = useState('disconnected');
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        try {
            ws.current = new WebSocket(url);
            
            ws.current.onopen = () => {
                console.log('WebSocket connected');
                setStatus('connected');
                
                // Send subscription message if provided
                if (options.subscribeMessage) {
                    ws.current.send(JSON.stringify(options.subscribeMessage));
                }
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    // Transform message if transformer provided
                    const transformedData = options.transformer 
                        ? options.transformer(message)
                        : message;
                    
                    setData(prevData => [...prevData, transformedData]);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('error');
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                setStatus('disconnected');
                
                // Auto-reconnect if enabled
                if (options.autoReconnect) {
                    reconnectTimeout.current = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, options.reconnectDelay || 5000);
                }
            };
        } catch (error) {
            console.error('Failed to connect:', error);
            setStatus('error');
        }
    }, [url, options]);

    const disconnect = useCallback(() => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }
        
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
    }, []);

    const sendMessage = useCallback((message) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { data, status, sendMessage, connect, disconnect };
};
```

### WebSocket Chart Component

```jsx
// WebSocketChart.jsx
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { useWebSocket } from './useWebSocket';

export const WebSocketChart = ({ symbol, wsUrl }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const series = useRef();
    const dataBuffer = useRef([]);

    const { data, status } = useWebSocket(wsUrl, {
        subscribeMessage: {
            type: 'subscribe',
            channels: ['trades'],
            symbols: [symbol]
        },
        transformer: (message) => ({
            time: Math.floor(message.timestamp / 1000),
            value: parseFloat(message.price)
        }),
        autoReconnect: true,
        reconnectDelay: 3000
    });

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
            },
        });

        series.current = chart.current.addLineSeries({
            color: status === 'connected' ? '#26a69a' : '#ef5350',
            lineWidth: 2,
        });

        return () => {
            chart.current.remove();
        };
    }, []);

    useEffect(() => {
        if (data.length > 0 && series.current) {
            const latestData = data[data.length - 1];
            
            // Buffer data to reduce update frequency
            dataBuffer.current.push(latestData);
            
            if (dataBuffer.current.length >= 10) {
                // Update with buffered data
                dataBuffer.current.forEach(point => {
                    series.current.update(point);
                });
                dataBuffer.current = [];
            }
        }
    }, [data]);

    return (
        <div>
            <div className="status">
                Status: <span className={`status-${status}`}>{status}</span>
            </div>
            <div ref={chartContainerRef} />
        </div>
    );
};
```

## Streaming Data Patterns

### Server-Sent Events (SSE)

```jsx
// useServerSentEvents.js
import { useState, useEffect } from 'react';

export const useServerSentEvents = (url, onMessage) => {
    const [status, setStatus] = useState('disconnected');

    useEffect(() => {
        const eventSource = new EventSource(url);

        eventSource.onopen = () => {
            setStatus('connected');
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('Error parsing SSE data:', error);
            }
        };

        eventSource.onerror = () => {
            setStatus('error');
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [url, onMessage]);

    return status;
};

// SSE Chart Component
export const SSEChart = ({ streamUrl }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const series = useRef();

    const status = useServerSentEvents(streamUrl, (data) => {
        if (series.current) {
            series.current.update({
                time: data.timestamp,
                value: data.price
            });
        }
    });

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        series.current = chart.current.addLineSeries();

        return () => {
            chart.current.remove();
        };
    }, []);

    return (
        <div>
            <div>Stream Status: {status}</div>
            <div ref={chartContainerRef} />
        </div>
    );
};
```

### Polling Pattern

```jsx
// usePolling.js
import { useState, useEffect, useRef } from 'react';

export const usePolling = (fetchFn, interval = 1000, enabled = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const intervalRef = useRef();

    useEffect(() => {
        if (!enabled) return;

        const poll = async () => {
            try {
                setLoading(true);
                const result = await fetchFn();
                setData(result);
                setError(null);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        poll();

        // Set up interval
        intervalRef.current = setInterval(poll, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchFn, interval, enabled]);

    return { data, loading, error };
};

// Polling Chart Component
export const PollingChart = ({ apiUrl, symbol }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const series = useRef();

    const fetchLatestPrice = async () => {
        const response = await fetch(`${apiUrl}/price/${symbol}`);
        const data = await response.json();
        return {
            time: Math.floor(Date.now() / 1000),
            value: data.price
        };
    };

    const { data } = usePolling(fetchLatestPrice, 1000);

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        series.current = chart.current.addLineSeries();

        return () => {
            chart.current.remove();
        };
    }, []);

    useEffect(() => {
        if (data && series.current) {
            series.current.update(data);
        }
    }, [data]);

    return <div ref={chartContainerRef} />;
};
```

## Performance Optimization

### Data Buffering

```jsx
// BufferedChart.jsx
export const BufferedChart = ({ dataStream }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const series = useRef();
    const buffer = useRef([]);
    const lastUpdateTime = useRef(0);

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        series.current = chart.current.addLineSeries();

        // Process buffer periodically
        const processBuffer = () => {
            const now = Date.now();
            
            // Update at most every 100ms
            if (now - lastUpdateTime.current < 100) return;
            
            if (buffer.current.length > 0) {
                // Batch update all buffered points
                const points = [...buffer.current];
                buffer.current = [];
                
                points.forEach(point => {
                    series.current.update(point);
                });
                
                lastUpdateTime.current = now;
            }
        };

        const interval = setInterval(processBuffer, 100);

        return () => {
            clearInterval(interval);
            chart.current.remove();
        };
    }, []);

    useEffect(() => {
        if (dataStream) {
            buffer.current.push(dataStream);
        }
    }, [dataStream]);

    return <div ref={chartContainerRef} />;
};
```

### Throttled Updates

```jsx
// ThrottledChart.jsx
import { throttle } from 'lodash';

export const ThrottledChart = ({ dataSource }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const series = useRef();

    const throttledUpdate = useMemo(
        () => throttle((data) => {
            if (series.current) {
                series.current.update(data);
            }
        }, 100), // Update at most every 100ms
        []
    );

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        series.current = chart.current.addLineSeries();

        return () => {
            throttledUpdate.cancel();
            chart.current.remove();
        };
    }, []);

    useEffect(() => {
        if (dataSource) {
            throttledUpdate(dataSource);
        }
    }, [dataSource, throttledUpdate]);

    return <div ref={chartContainerRef} />;
};
```

## Multiple Data Sources

### Aggregated Data Chart

```jsx
// AggregatedChart.jsx
export const AggregatedChart = ({ sources }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const seriesMap = useRef(new Map());
    const [aggregatedData, setAggregatedData] = useState({});

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        // Create series for each source
        sources.forEach(source => {
            const series = chart.current.addLineSeries({
                color: source.color,
                title: source.name,
            });
            seriesMap.current.set(source.id, series);
        });

        return () => {
            chart.current.remove();
        };
    }, [sources]);

    useEffect(() => {
        // Connect to multiple data sources
        const connections = sources.map(source => {
            const ws = new WebSocket(source.url);
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setAggregatedData(prev => ({
                    ...prev,
                    [source.id]: {
                        time: Math.floor(data.timestamp / 1000),
                        value: data.price
                    }
                }));
            };

            return ws;
        });

        return () => {
            connections.forEach(ws => ws.close());
        };
    }, [sources]);

    useEffect(() => {
        // Update each series with its data
        Object.entries(aggregatedData).forEach(([sourceId, data]) => {
            const series = seriesMap.current.get(sourceId);
            if (series) {
                series.update(data);
            }
        });
    }, [aggregatedData]);

    return <div ref={chartContainerRef} />;
};
```

## Error Handling and Recovery

### Resilient Real-Time Chart

```jsx
// ResilientChart.jsx
export const ResilientChart = ({ dataUrl, maxRetries = 3 }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const series = useRef();
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const connectToDataSource = useCallback(() => {
        const ws = new WebSocket(dataUrl);

        ws.onopen = () => {
            console.log('Connected to data source');
            setError(null);
            setRetryCount(0);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (series.current) {
                    series.current.update({
                        time: data.timestamp,
                        value: data.value
                    });
                }
            } catch (err) {
                console.error('Error processing data:', err);
            }
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError('Connection error');
        };

        ws.onclose = () => {
            if (retryCount < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
                console.log(`Reconnecting in ${delay}ms...`);
                
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    connectToDataSource();
                }, delay);
            } else {
                setError('Max retries exceeded');
            }
        };

        return ws;
    }, [dataUrl, retryCount, maxRetries]);

    useEffect(() => {
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        series.current = chart.current.addLineSeries();

        const ws = connectToDataSource();

        return () => {
            ws.close();
            chart.current.remove();
        };
    }, [connectToDataSource]);

    return (
        <div>
            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={() => {
                        setRetryCount(0);
                        connectToDataSource();
                    }}>
                        Retry
                    </button>
                </div>
            )}
            <div ref={chartContainerRef} />
        </div>
    );
};
```

## Data Synchronization

### Time Synchronization

```jsx
// SynchronizedChart.jsx
export const SynchronizedChart = ({ dataSource }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const series = useRef();
    const timeOffset = useRef(0);

    useEffect(() => {
        // Synchronize with server time
        fetch('/api/server-time')
            .then(res => res.json())
            .then(data => {
                const serverTime = data.timestamp;
                const localTime = Date.now();
                timeOffset.current = serverTime - localTime;
            });

        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
        });

        series.current = chart.current.addLineSeries();

        return () => {
            chart.current.remove();
        };
    }, []);

    useEffect(() => {
        if (dataSource && series.current) {
            // Adjust timestamp with offset
            const adjustedData = {
                ...dataSource,
                time: Math.floor((dataSource.timestamp + timeOffset.current) / 1000)
            };
            
            series.current.update(adjustedData);
        }
    }, [dataSource]);

    return <div ref={chartContainerRef} />;
};
```

## Best Practices

1. **Update vs SetData**: Always use `update()` for real-time data
2. **Buffer Updates**: Batch multiple updates to reduce rendering overhead
3. **Throttle/Debounce**: Limit update frequency for high-volume data
4. **Error Recovery**: Implement automatic reconnection with exponential backoff
5. **Memory Management**: Clean up WebSocket connections and intervals
6. **Time Synchronization**: Account for client-server time differences
7. **Connection Status**: Display connection status to users
8. **Data Validation**: Validate incoming data before updating charts

## Example: Complete Real-Time Trading Chart

```jsx
// TradingChart.jsx
import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';

export const TradingChart = ({ symbol, apiUrl, wsUrl }) => {
    const chartContainerRef = useRef();
    const chart = useRef();
    const candleSeries = useRef();
    const volumeSeries = useRef();
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        // Initialize chart
        chart.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 500,
            layout: {
                background: { type: 'solid', color: '#1e1e1e' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            timeScale: {
                timeVisible: true,
                borderColor: '#485c7b',
            },
        });

        // Add candlestick series
        candleSeries.current = chart.current.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        // Add volume series
        volumeSeries.current = chart.current.addHistogramSeries({
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        // Load initial data
        fetch(`${apiUrl}/candles/${symbol}`)
            .then(res => res.json())
            .then(data => {
                candleSeries.current.setData(data.candles);
                volumeSeries.current.setData(data.volumes);
                setStatus('connected');
            })
            .catch(err => {
                console.error('Failed to load initial data:', err);
                setStatus('error');
            });

        // Connect to WebSocket for real-time updates
        const ws = new WebSocket(`${wsUrl}/${symbol}`);

        ws.onopen = () => {
            console.log('Real-time connection established');
            ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'candle') {
                candleSeries.current.update(data.candle);
            }
            
            if (data.type === 'volume') {
                volumeSeries.current.update(data.volume);
            }
        };

        ws.onerror = () => {
            setStatus('error');
        };

        return () => {
            ws.close();
            chart.current.remove();
        };
    }, [symbol, apiUrl, wsUrl]);

    return (
        <div className="trading-chart">
            <div className="chart-header">
                <h3>{symbol}</h3>
                <span className={`status ${status}`}>{status}</span>
            </div>
            <div ref={chartContainerRef} />
        </div>
    );
};
```

## Next Steps

- Implement technical indicators overlay
- Add order placement on chart
- Create price alerts system
- Build trade execution from chart
- Add drawing tools for analysis