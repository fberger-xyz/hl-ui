/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, CrosshairMode, LineStyle, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts'
import { useChartDataSubscription } from '@/hooks/useChartDataSubscription'
import type { CandleInterval, HyperliquidCandle } from '@/types/hyperliquid.types'
import { useMarketStore } from '@/stores/market.store'
import { cn } from '@/utils'
import { logger } from '@/utils/logger.util'

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

const TradingChart = React.memo(
    function TradingChartComponent() {
        logger.render('TradingChart')

        const containerRef = useRef<HTMLDivElement>(null)
        const chartRef = useRef<ReturnType<typeof createChart> | null>(null)

        const candleSeriesRef = useRef<any>(null)
        const lineSeriesRef = useRef<any>(null)
        const areaSeriesRef = useRef<any>(null)
        const volumeSeriesRef = useRef<any>(null)
        const priceLineRef = useRef<any>(null)
        const [currentInterval, setCurrentInterval] = useState<CandleInterval>('1m')
        const [chartType] = useState<ChartType>('candlestick')
        const [isInitialLoading, setIsInitialLoading] = useState(true)

        // get symbol from market store
        const selectedMarket = useMarketStore((state) => state.selectedMarket)
        const symbol = selectedMarket?.symbol || 'BTC'

        // store candles in ref to prevent re-renders
        const candlesRef = useRef<HyperliquidCandle[]>([])
        const lastUpdateTimeRef = useRef(0)
        const initialDataSetRef = useRef(false)
        const initialZoomSetRef = useRef(false)
        const prevCandlesLengthRef = useRef(0)
        const prevSymbolRef = useRef(symbol)

        const handleIntervalChange = (newInterval: CandleInterval) => {
            setCurrentInterval(newInterval)
            setIsInitialLoading(true)
            // reset initial data flag when interval changes
            initialDataSetRef.current = false
            initialZoomSetRef.current = false
            candlesRef.current = []
            prevCandlesLengthRef.current = 0
        }

        useEffect(() => {
            if (!containerRef.current || chartRef.current) return // prevent recreation

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
                // disable animations for better performance
                kineticScroll: {
                    touch: false,
                    mouse: false,
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
                if (chartRef.current) {
                    chartRef.current.remove()
                    chartRef.current = null
                }
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []) // intentionally exclude chartType to prevent chart recreation on type change

        // update chart when candles change
        const updateChart = useCallback(
            (newCandles: HyperliquidCandle[]) => {
                // throttle updates to prevent excessive re-renders
                const now = Date.now()
                if (now - lastUpdateTimeRef.current < 100) return
                lastUpdateTimeRef.current = now

                // update ref with latest candles
                candlesRef.current = newCandles

                // hide spinner once we have data
                if (newCandles.length > 0 && isInitialLoading) {
                    setIsInitialLoading(false)
                }

                if (newCandles.length === 0 || !volumeSeriesRef.current) return

                // filter out invalid candles and ensure valid time values
                const validCandles = newCandles.filter((c) => {
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

                if (validCandles.length === 0) {
                    console.warn('No valid candles to display')
                    return
                }

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

                const lastCandle = sortedCandles[sortedCandles.length - 1] || null

                // use setData for initial load or significant changes
                if (!initialDataSetRef.current || Math.abs(candleData.length - prevCandlesLengthRef.current) > 10) {
                    console.log('Setting chart data, candles:', candleData.length, 'initialZoomSet:', initialZoomSetRef.current)
                    requestAnimationFrame(() => {
                        if (candleSeriesRef.current) candleSeriesRef.current.setData(candleData)
                        if (lineSeriesRef.current) lineSeriesRef.current.setData(lineData)
                        if (areaSeriesRef.current) areaSeriesRef.current.setData(lineData)
                        if (volumeSeriesRef.current) volumeSeriesRef.current.setData(volumeData)

                        initialDataSetRef.current = true

                        // set reasonable zoom AFTER data is set
                        if (chartRef.current && !initialZoomSetRef.current && candleData.length > 0) {
                            console.log('Setting initial zoom for', candleData.length, 'candles')
                            // show last 50-100 candles depending on interval
                            const visibleCandles =
                                currentInterval === '1m'
                                    ? 100
                                    : currentInterval === '3m'
                                      ? 80
                                      : currentInterval === '5m'
                                        ? 60
                                        : currentInterval === '15m'
                                          ? 50
                                          : currentInterval === '30m'
                                            ? 40
                                            : currentInterval === '1h'
                                              ? 30
                                              : 50

                            const totalCandles = candleData.length
                            console.log('Total candles:', totalCandles, 'Visible candles target:', visibleCandles)

                            if (totalCandles > visibleCandles) {
                                const from = candleData[totalCandles - visibleCandles].time
                                const to = candleData[totalCandles - 1].time
                                console.log('Setting visible range from', from, 'to', to)
                                chartRef.current.timeScale().setVisibleRange({ from: from as any, to: to as any })
                            } else {
                                console.log('Using fitContent for', totalCandles, 'candles')
                                chartRef.current.timeScale().fitContent()
                            }

                            chartRef.current.priceScale('right').applyOptions({
                                autoScale: true,
                                scaleMargins: {
                                    top: 0.1,
                                    bottom: 0.25,
                                },
                            })
                            initialZoomSetRef.current = true
                            console.log('Initial zoom set complete')
                        }
                    })
                } else if (candleData.length > 0 && prevCandlesLengthRef.current > 0) {
                    // use update for the last candle only to preserve user zoom
                    const latestCandle = candleData[candleData.length - 1]
                    const latestLine = lineData[lineData.length - 1]
                    const latestVolume = volumeData[volumeData.length - 1]

                    requestAnimationFrame(() => {
                        if (candleSeriesRef.current) candleSeriesRef.current.update(latestCandle)
                        if (lineSeriesRef.current) lineSeriesRef.current.update(latestLine)
                        if (areaSeriesRef.current) areaSeriesRef.current.update(latestLine)
                        if (volumeSeriesRef.current) volumeSeriesRef.current.update(latestVolume)
                    })
                }

                prevCandlesLengthRef.current = candleData.length

                // update price line
                if (lastCandle && chartType === 'candlestick') {
                    const currentPrice = parseFloat(lastCandle.c)
                    const priceChange = parseFloat(lastCandle.c) >= parseFloat(lastCandle.o)

                    // remove old price line if exists
                    if (priceLineRef.current && candleSeriesRef.current) {
                        candleSeriesRef.current.removePriceLine(priceLineRef.current)
                    }

                    // add new price line to active series
                    if (candleSeriesRef.current) {
                        const priceLineOptions = {
                            price: currentPrice,
                            color: priceChange ? CHART_COLORS.bullish : CHART_COLORS.bearish,
                            lineWidth: 1 as const,
                            lineStyle: LineStyle.Dashed,
                            axisLabelVisible: true,
                            title: '',
                        }
                        priceLineRef.current = candleSeriesRef.current.createPriceLine(priceLineOptions)
                    }
                }
            },
            [chartType, isInitialLoading, currentInterval],
        )

        // subscribe to chart data
        useChartDataSubscription(symbol, currentInterval, updateChart)

        // reset initial data flag when symbol changes
        useEffect(() => {
            if (prevSymbolRef.current !== symbol) {
                setIsInitialLoading(true)
                initialDataSetRef.current = false
                initialZoomSetRef.current = false
                prevCandlesLengthRef.current = 0
                // clear existing data when symbol changes
                if (chartRef.current) {
                    if (candleSeriesRef.current) candleSeriesRef.current.setData([])
                    if (lineSeriesRef.current) lineSeriesRef.current.setData([])
                    if (areaSeriesRef.current) areaSeriesRef.current.setData([])
                    if (volumeSeriesRef.current) volumeSeriesRef.current.setData([])
                    // reset chart view
                    chartRef.current.timeScale().resetTimeScale()
                    chartRef.current.priceScale('right').applyOptions({ autoScale: true })
                }
                prevSymbolRef.current = symbol
            }
        }, [symbol])

        return (
            <section className="relative flex size-full h-full flex-col">
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
                        {/* TODO: make it cleaner later */}
                        {/* <div className="flex gap-1" role="group" aria-label="Chart type">
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
                    </div> */}
                    </div>

                    <div className="flex items-center gap-2 text-xs"></div>
                </nav>

                <article className="relative h-full w-full" aria-label="Trading chart">
                    <div ref={containerRef} className="h-full w-full" />
                    <p className="absolute bottom-[20%] left-2 z-10 text-xs text-hlt-17">Volume</p>

                    {isInitialLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-hlb-21">
                            <div className="text-center">
                                <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-hlr-5 border-t-transparent" />
                            </div>
                        </div>
                    )}
                </article>
            </section>
        )
    },
    () => true, // prevent all re-renders
)

export default TradingChart
