/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, LineStyle, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts'
import { useHyperliquidChart } from '@/hooks/useHyperliquidChart'
import type { CandleInterval, HyperliquidCandle } from '@/types/hyperliquid.types'
import { useUiStore } from '@/stores/ui.store'
import { useMarketStore } from '@/stores/market.store'
import { cn } from '@/utils'

interface TradingChartProps {
    className?: string
}

const INTERVALS: Array<{ label: string; value: CandleInterval }> = [
    { label: '1m', value: '1m' },
    { label: '3m', value: '3m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1H', value: '1h' },
    // { label: '2H', value: '2h' },
    // { label: '4H', value: '4h' },
    // { label: '8H', value: '8h' },
    // { label: '12H', value: '12h' },
    // { label: '1D', value: '1d' },
    // { label: '3D', value: '3d' },
    // { label: '1W', value: '1w' },
    // { label: '1M', value: '1M' },
]

const CHART_COLORS = {
    background: 'transparent',
    text: '#868993', // hlt-17
    grid: 'rgba(67, 70, 81, 0.3)', // hlr-5 with opacity
    crosshair: 'rgba(134, 137, 147, 0.5)', // hlr-4 with opacity
    crosshairLabel: 'rgba(67, 70, 81, 0.8)', // hlr-5 with opacity
    border: 'transparent',
    bullish: '#26A69A', // green candles
    bearish: '#F05350', // red candles
    volumeBullish: 'rgba(38, 166, 154, 0.5)', // green volume with opacity
    volumeBearish: 'rgba(240, 83, 80, 0.5)', // red volume with opacity
} as const

type ChartType = 'candlestick' | 'line' | 'area'

function TradingChart({ className = 'h-full w-full' }: TradingChartProps = {}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null)

    const candleSeriesRef = useRef<any>(null)
    const lineSeriesRef = useRef<any>(null)
    const areaSeriesRef = useRef<any>(null)
    const volumeSeriesRef = useRef<any>(null)
    const priceLineRef = useRef<any>(null)
    const [currentInterval, setCurrentInterval] = useState<CandleInterval>('1m')
    const [chartType, setChartType] = useState<ChartType>('candlestick')

    // get symbol directly from store
    const currentSymbol = useUiStore((state) => state.currentSymbol)
    const subscribeToMarket = useMarketStore((state) => state.subscribeToMarket)
    const symbol = currentSymbol

    // ensure market subscription is active
    useEffect(() => {
        if (!symbol) return
        subscribeToMarket(symbol)
    }, [symbol, subscribeToMarket])

    const { candles, isLoading, error, changeInterval } = useHyperliquidChart({
        symbol,
        interval: currentInterval,
        lookbackHours: 24,
    })

    const handleIntervalChange = (newInterval: CandleInterval) => {
        setCurrentInterval(newInterval)
        changeInterval(newInterval)
        // reset initial data flag when interval changes
        initialDataSetRef.current = false
    }

    useEffect(() => {
        if (!containerRef.current) return

        const chartHeight = containerRef.current.clientHeight
        const chart = createChart(containerRef.current, {
            autoSize: true,
            height: chartHeight,
            layout: {
                background: {
                    type: ColorType.Solid,
                    color: CHART_COLORS.background,
                },
                textColor: CHART_COLORS.text,
            },
            grid: {
                vertLines: { color: CHART_COLORS.grid },
                horzLines: { color: CHART_COLORS.grid },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: CHART_COLORS.crosshair,
                    width: 1,
                    style: LineStyle.Dashed,
                    labelBackgroundColor: CHART_COLORS.crosshairLabel,
                },
                horzLine: {
                    color: CHART_COLORS.crosshair,
                    width: 1,
                    style: LineStyle.Dashed,
                    labelBackgroundColor: CHART_COLORS.crosshairLabel,
                },
            },
            rightPriceScale: {
                borderColor: CHART_COLORS.border,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.25,
                },
            },
            timeScale: {
                borderColor: CHART_COLORS.border,
                timeVisible: true,
                secondsVisible: false,
            },
            localization: {
                priceFormatter: (price: number) => {
                    // smart decimal places based on price value
                    if (price >= 1000) return price.toFixed(2)
                    if (price >= 1) return price.toFixed(4)
                    if (price >= 0.01) return price.toFixed(6)
                    return price.toFixed(8)
                },
            },
        })

        // create all series types but only show one at a time
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: CHART_COLORS.bullish,
            downColor: CHART_COLORS.bearish,
            borderUpColor: CHART_COLORS.bullish,
            borderDownColor: CHART_COLORS.bearish,
            wickUpColor: CHART_COLORS.bullish,
            wickDownColor: CHART_COLORS.bearish,
            visible: chartType === 'candlestick',
            lastValueVisible: false,
            priceLineVisible: false,
        })

        const lineSeries = chart.addSeries(LineSeries, {
            color: CHART_COLORS.bullish,
            lineWidth: 2,
            visible: chartType === 'line',
            lastValueVisible: false,
            priceLineVisible: false,
        })

        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: CHART_COLORS.bullish,
            topColor: 'rgba(38, 166, 154, 0.3)',
            bottomColor: 'rgba(38, 166, 154, 0.05)',
            lineWidth: 2,
            visible: chartType === 'area',
            lastValueVisible: false,
            priceLineVisible: false,
        })

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            priceLineVisible: false,
            lastValueVisible: false,
        })

        // set volume series to use 20% of chart height
        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        })

        chartRef.current = chart
        candleSeriesRef.current = candleSeries
        lineSeriesRef.current = lineSeries
        areaSeriesRef.current = areaSeries
        volumeSeriesRef.current = volumeSeries

        return () => {
            chart.remove()
        }
    }, [symbol, chartType])

    // track if initial data has been set
    const initialDataSetRef = useRef(false)
    const prevCandlesLengthRef = useRef(0)
    const prevSymbolRef = useRef(symbol)

    // reset initial data flag when symbol changes
    useEffect(() => {
        initialDataSetRef.current = false
        prevCandlesLengthRef.current = 0
        // clear existing data when symbol changes
        if (prevSymbolRef.current === symbol || !chartRef.current) return
        if (candleSeriesRef.current) candleSeriesRef.current.setData([])
        if (lineSeriesRef.current) lineSeriesRef.current.setData([])
        if (areaSeriesRef.current) areaSeriesRef.current.setData([])
        if (volumeSeriesRef.current) volumeSeriesRef.current.setData([])
        // reset chart view
        chartRef.current.timeScale().resetTimeScale()
        chartRef.current.priceScale('right').applyOptions({ autoScale: true })
        prevSymbolRef.current = symbol
    }, [symbol])

    useEffect(() => {
        if (!volumeSeriesRef.current || candles.length === 0) return

        // filter out invalid candles and ensure valid time values
        const validCandles = candles.filter((c) => {
            const time = Number(c.t)
            const open = parseFloat(c.o)
            const high = parseFloat(c.h)
            const low = parseFloat(c.l)
            const close = parseFloat(c.c)
            // validate candle data integrity
            return (
                !isNaN(time) &&
                time > 0 &&
                !isNaN(open) &&
                !isNaN(high) &&
                !isNaN(low) &&
                !isNaN(close) &&
                high >= low &&
                high >= open &&
                high >= close &&
                low <= open &&
                low <= close
            )
        })

        if (validCandles.length === 0) return console.warn('No valid candles to display')

        // sort candles by time to ensure proper ordering
        const sortedCandles = [...validCandles].sort((a, b) => Number(a.t) - Number(b.t))

        const candleData = sortedCandles.map((c: HyperliquidCandle) => ({
            time: Math.floor(Number(c.t) / 1000),
            open: parseFloat(c.o),
            high: parseFloat(c.h),
            low: parseFloat(c.l),
            close: parseFloat(c.c),
        }))

        const lineData = sortedCandles.map((c: HyperliquidCandle) => ({
            time: Math.floor(Number(c.t) / 1000),
            value: parseFloat(c.c), // use close price for line
        }))

        const volumeData = sortedCandles.map((c: HyperliquidCandle) => ({
            time: Math.floor(Number(c.t) / 1000),
            value: Math.abs(parseFloat(c.v)), // ensure volume is always positive
            color: parseFloat(c.c) >= parseFloat(c.o) ? CHART_COLORS.volumeBullish : CHART_COLORS.volumeBearish,
        }))

        // only use setData on initial load or when interval changes or significant data changes
        if (!initialDataSetRef.current || Math.abs(candles.length - prevCandlesLengthRef.current) > 10) {
            if (candleSeriesRef.current) candleSeriesRef.current.setData(candleData)
            if (lineSeriesRef.current) lineSeriesRef.current.setData(lineData)
            if (areaSeriesRef.current) areaSeriesRef.current.setData(lineData)
            if (volumeSeriesRef.current) volumeSeriesRef.current.setData(volumeData)
            initialDataSetRef.current = true

            // fit content and ensure proper scaling
            if (!chartRef.current) return
            chartRef.current.timeScale().fitContent()
            // ensure y-axis auto-scales to visible range
            chartRef.current.priceScale('right').applyOptions({
                autoScale: true,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.25,
                },
            })
        } else if (candleData.length > 0) {
            // use update for real-time updates to preserve zoom
            const latestCandle = candleData[candleData.length - 1]
            const latestLine = lineData[lineData.length - 1]
            const latestVolume = volumeData[volumeData.length - 1]

            if (candleSeriesRef.current) candleSeriesRef.current.update(latestCandle)
            if (lineSeriesRef.current) lineSeriesRef.current.update(latestLine)
            if (areaSeriesRef.current) areaSeriesRef.current.update(latestLine)
            if (volumeSeriesRef.current) volumeSeriesRef.current.update(latestVolume)
        }

        prevCandlesLengthRef.current = candles.length

        // add current price line to the active series
        if (sortedCandles.length > 0) {
            const lastCandle = sortedCandles[sortedCandles.length - 1]
            const currentPrice = parseFloat(lastCandle.c)
            const priceChange = parseFloat(lastCandle.c) >= parseFloat(lastCandle.o)

            // remove old price line if exists
            if (!priceLineRef.current) return
            if (chartType === 'candlestick' && candleSeriesRef.current) {
                candleSeriesRef.current.removePriceLine(priceLineRef.current)
            } else if (chartType === 'line' && lineSeriesRef.current) {
                lineSeriesRef.current.removePriceLine(priceLineRef.current)
            } else if (chartType === 'area' && areaSeriesRef.current) {
                areaSeriesRef.current.removePriceLine(priceLineRef.current)
            }

            // add new price line to active series
            const priceLineOptions = {
                price: currentPrice,
                color: priceChange ? CHART_COLORS.bullish : CHART_COLORS.bearish,
                lineWidth: 1 as const,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: '',
            }

            if (chartType === 'candlestick' && candleSeriesRef.current) {
                priceLineRef.current = candleSeriesRef.current.createPriceLine(priceLineOptions)
            } else if (chartType === 'line' && lineSeriesRef.current) {
                priceLineRef.current = lineSeriesRef.current.createPriceLine(priceLineOptions)
            } else if (chartType === 'area' && areaSeriesRef.current) {
                priceLineRef.current = areaSeriesRef.current.createPriceLine(priceLineOptions)
            }
        }
    }, [candles, chartType])

    return (
        <section className={cn('relative flex h-full flex-col', className)}>
            <nav className="absolute left-0 top-1 z-10 flex w-full items-center justify-between" aria-label="Chart controls">
                <div className="z-40 flex flex-col">
                    {/* Interval selector */}
                    <div className="flex gap-1" role="group" aria-label="Timeframe intervals">
                        {INTERVALS.map((int) => (
                            <button
                                key={int.value}
                                onClick={() => handleIntervalChange(int.value)}
                                className={cn(
                                    'px-2 py-0.5 text-xs transition-colors',
                                    currentInterval === int.value ? 'text-hlt-8' : 'text-hlt-17 hover:text-hlt-8',
                                )}>
                                {int.label}
                            </button>
                        ))}
                    </div>

                    {/* Chart type selector */}
                    <div className="flex gap-1" role="group" aria-label="Chart type">
                        <button
                            onClick={() => setChartType('candlestick')}
                            className={cn(
                                'px-2 py-0.5 text-xs transition-colors',
                                chartType === 'candlestick' ? 'text-hlt-8' : 'text-hlt-17 hover:text-hlt-4',
                            )}
                            title="Candlestick Chart">
                            Candles
                        </button>
                        <button
                            onClick={() => setChartType('line')}
                            className={cn(
                                'px-2 py-0.5 text-xs transition-colors',
                                chartType === 'line' ? 'text-hlt-8' : 'text-hlt-17 hover:text-hlt-4',
                            )}
                            title="Line Chart">
                            Line
                        </button>
                        <button
                            onClick={() => setChartType('area')}
                            className={cn(
                                'px-2 py-0.5 text-xs transition-colors',
                                chartType === 'area' ? 'text-hlt-8' : 'text-hlt-17 hover:text-hlt-4',
                            )}
                            title="Area Chart">
                            Area
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs">{error && <span className="text-hlt-12">{error}</span>}</div>
            </nav>

            <article className="relative h-full w-full" aria-label="Trading chart">
                <div ref={containerRef} className="h-full w-full" />
                <p className="absolute bottom-[20%] left-2 z-10 text-xs text-hlt-17">Volume</p>

                {isLoading && candles.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-hlb-21">
                        <div className="text-center">
                            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-hlr-5 border-t-transparent" />
                        </div>
                    </div>
                )}
            </article>
        </section>
    )
}

// removed memo - component needs to re-render on interval change
export default TradingChart
