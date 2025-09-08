# TradingView Lightweight Charts API Reference

## Installation

```bash
npm install lightweight-charts
# or
yarn add lightweight-charts
# or
pnpm add lightweight-charts
```

## Chart Creation

### createChart(container, options?)

Creates a new chart instance.

```typescript
import { createChart } from 'lightweight-charts';

const chart = createChart(container: HTMLElement, options?: ChartOptions);
```

#### ChartOptions

```typescript
interface ChartOptions {
    width?: number;
    height?: number;
    layout?: LayoutOptions;
    leftPriceScale?: PriceScaleOptions;
    rightPriceScale?: PriceScaleOptions;
    overlayPriceScales?: OverlayPriceScaleOptions;
    timeScale?: TimeScaleOptions;
    crosshair?: CrosshairOptions;
    grid?: GridOptions;
    localization?: LocalizationOptions;
    handleScroll?: HandleScrollOptions;
    handleScale?: HandleScaleOptions;
    kineticScroll?: KineticScrollOptions;
    trackingMode?: TrackingModeOptions;
    watermark?: WatermarkOptions;
}
```

### Layout Options

```typescript
interface LayoutOptions {
    background?: Background;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
}

interface Background {
    type: ColorType.Solid | ColorType.VerticalGradient;
    color?: string;
    topColor?: string;
    bottomColor?: string;
}
```

### Price Scale Options

```typescript
interface PriceScaleOptions {
    autoScale?: boolean;
    mode?: PriceScaleMode;
    invertScale?: boolean;
    alignLabels?: boolean;
    borderVisible?: boolean;
    borderColor?: string;
    entire?: boolean;
    visible?: boolean;
    ticksVisible?: boolean;
    scaleMargins?: {
        top?: number;
        bottom?: number;
    };
}

enum PriceScaleMode {
    Normal = 0,
    Logarithmic = 1,
    Percentage = 2,
    IndexedTo100 = 3,
}
```

### Time Scale Options

```typescript
interface TimeScaleOptions {
    rightOffset?: number;
    barSpacing?: number;
    minBarSpacing?: number;
    fixLeftEdge?: boolean;
    fixRightEdge?: boolean;
    lockVisibleTimeRangeOnResize?: boolean;
    rightBarStaysOnScroll?: boolean;
    borderVisible?: boolean;
    borderColor?: string;
    visible?: boolean;
    timeVisible?: boolean;
    secondsVisible?: boolean;
    shiftVisibleRangeOnNewBar?: boolean;
    tickMarkFormatter?: TickMarkFormatter;
}
```

### Crosshair Options

```typescript
interface CrosshairOptions {
    mode?: CrosshairMode;
    vertLine?: CrosshairLineOptions;
    horzLine?: CrosshairLineOptions;
}

enum CrosshairMode {
    Normal = 0,
    Magnet = 1,
}

interface CrosshairLineOptions {
    visible?: boolean;
    width?: number;
    color?: string;
    style?: LineStyle;
    labelVisible?: boolean;
    labelBackgroundColor?: string;
}
```

### Grid Options

```typescript
interface GridOptions {
    vertLines?: LineOptions;
    horzLines?: LineOptions;
}

interface LineOptions {
    visible?: boolean;
    color?: string;
    style?: LineStyle;
}

enum LineStyle {
    Solid = 0,
    Dotted = 1,
    Dashed = 2,
    LargeDashed = 3,
    SparseDotted = 4,
}
```

## Series Types

### Line Series

```typescript
const lineSeries = chart.addLineSeries(options?: LineSeriesOptions);

interface LineSeriesOptions extends SeriesOptionsCommon {
    color?: string;
    lineStyle?: LineStyle;
    lineWidth?: number;
    lineType?: LineType;
    crosshairMarkerVisible?: boolean;
    crosshairMarkerRadius?: number;
    crosshairMarkerBorderColor?: string;
    crosshairMarkerBackgroundColor?: string;
    lastPriceAnimation?: LastPriceAnimationMode;
}
```

### Area Series

```typescript
const areaSeries = chart.addAreaSeries(options?: AreaSeriesOptions);

interface AreaSeriesOptions extends SeriesOptionsCommon {
    topColor?: string;
    bottomColor?: string;
    lineColor?: string;
    lineStyle?: LineStyle;
    lineWidth?: number;
    lineType?: LineType;
    crosshairMarkerVisible?: boolean;
    crosshairMarkerRadius?: number;
    crosshairMarkerBorderColor?: string;
    crosshairMarkerBackgroundColor?: string;
    lastPriceAnimation?: LastPriceAnimationMode;
}
```

### Candlestick Series

```typescript
const candlestickSeries = chart.addCandlestickSeries(options?: CandlestickSeriesOptions);

interface CandlestickSeriesOptions extends SeriesOptionsCommon {
    upColor?: string;
    downColor?: string;
    borderVisible?: boolean;
    wickVisible?: boolean;
    borderColor?: string;
    wickColor?: string;
    borderUpColor?: string;
    borderDownColor?: string;
    wickUpColor?: string;
    wickDownColor?: string;
}
```

### Bar Series

```typescript
const barSeries = chart.addBarSeries(options?: BarSeriesOptions);

interface BarSeriesOptions extends SeriesOptionsCommon {
    upColor?: string;
    downColor?: string;
    openVisible?: boolean;
    thinBars?: boolean;
}
```

### Histogram Series

```typescript
const histogramSeries = chart.addHistogramSeries(options?: HistogramSeriesOptions);

interface HistogramSeriesOptions extends SeriesOptionsCommon {
    color?: string;
    base?: number;
}
```

### Baseline Series

```typescript
const baselineSeries = chart.addBaselineSeries(options?: BaselineSeriesOptions);

interface BaselineSeriesOptions extends SeriesOptionsCommon {
    baseValue?: BaseValueType;
    topFillColor1?: string;
    topFillColor2?: string;
    topLineColor?: string;
    bottomFillColor1?: string;
    bottomFillColor2?: string;
    bottomLineColor?: string;
    lineWidth?: number;
    lineStyle?: LineStyle;
    crosshairMarkerVisible?: boolean;
    crosshairMarkerRadius?: number;
    crosshairMarkerBorderColor?: string;
    crosshairMarkerBackgroundColor?: string;
}
```

## Series Methods

### setData(data)

Sets the series data.

```typescript
series.setData(data: SeriesData[]);

// Line/Area data
interface LineData {
    time: Time;
    value: number;
}

// Candlestick/Bar data
interface OhlcData {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
}

// Histogram data
interface HistogramData {
    time: Time;
    value: number;
    color?: string;
}
```

### update(data)

Updates the last data point or adds a new one.

```typescript
series.update(data: SeriesData);
```

### setMarkers(markers)

Sets markers on the series.

```typescript
series.setMarkers(markers: SeriesMarker[]);

interface SeriesMarker {
    time: Time;
    position: SeriesMarkerPosition;
    color: string;
    shape: SeriesMarkerShape;
    text?: string;
    size?: number;
}

type SeriesMarkerPosition = 'aboveBar' | 'belowBar' | 'inBar';
type SeriesMarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown';
```

### createPriceLine(options)

Creates a price line.

```typescript
const priceLine = series.createPriceLine(options: PriceLineOptions);

interface PriceLineOptions {
    price: number;
    color?: string;
    lineWidth?: number;
    lineStyle?: LineStyle;
    lineVisible?: boolean;
    axisLabelVisible?: boolean;
    title?: string;
}
```

### removePriceLine(priceLine)

Removes a price line.

```typescript
series.removePriceLine(priceLine: IPriceLine);
```

### priceToCoordinate(price)

Converts price to Y coordinate.

```typescript
const coordinate = series.priceToCoordinate(price: number): number | null;
```

### coordinateToPrice(coordinate)

Converts Y coordinate to price.

```typescript
const price = series.coordinateToPrice(coordinate: number): number | null;
```

## Chart Methods

### remove()

Removes the chart and cleans up resources.

```typescript
chart.remove(): void;
```

### resize(width, height)

Resizes the chart.

```typescript
chart.resize(width: number, height: number): void;
```

### timeScale()

Returns the time scale API.

```typescript
const timeScale = chart.timeScale(): ITimeScaleApi;
```

### priceScale(id?)

Returns the price scale API.

```typescript
const priceScale = chart.priceScale(id?: string): IPriceScaleApi;
```

### applyOptions(options)

Updates chart options.

```typescript
chart.applyOptions(options: DeepPartial<ChartOptions>): void;
```

### options()

Returns current chart options.

```typescript
const options = chart.options(): ChartOptions;
```

### takeScreenshot()

Takes a screenshot of the chart.

```typescript
const canvas = chart.takeScreenshot(): HTMLCanvasElement;
```

### removeSeries(series)

Removes a series from the chart.

```typescript
chart.removeSeries(series: ISeriesApi): void;
```

## Time Scale API

### scrollPosition()

Returns the current scroll position.

```typescript
const position = timeScale.scrollPosition(): number;
```

### scrollToPosition(position, animated)

Scrolls to a specific position.

```typescript
timeScale.scrollToPosition(position: number, animated: boolean): void;
```

### scrollToRealTime()

Scrolls to the real-time data.

```typescript
timeScale.scrollToRealTime(): void;
```

### getVisibleRange()

Returns the visible time range.

```typescript
const range = timeScale.getVisibleRange(): TimeRange | null;

interface TimeRange {
    from: Time;
    to: Time;
}
```

### setVisibleRange(range)

Sets the visible time range.

```typescript
timeScale.setVisibleRange(range: TimeRange): void;
```

### getVisibleLogicalRange()

Returns the visible logical range.

```typescript
const range = timeScale.getVisibleLogicalRange(): LogicalRange | null;

interface LogicalRange {
    from: number;
    to: number;
}
```

### setVisibleLogicalRange(range)

Sets the visible logical range.

```typescript
timeScale.setVisibleLogicalRange(range: LogicalRange): void;
```

### resetTimeScale()

Resets the time scale.

```typescript
timeScale.resetTimeScale(): void;
```

### fitContent()

Fits content to the visible area.

```typescript
timeScale.fitContent(): void;
```

### timeToCoordinate(time)

Converts time to X coordinate.

```typescript
const coordinate = timeScale.timeToCoordinate(time: Time): number | null;
```

### coordinateToTime(coordinate)

Converts X coordinate to time.

```typescript
const time = timeScale.coordinateToTime(coordinate: number): Time | null;
```

## Price Scale API

### getMode()

Returns the price scale mode.

```typescript
const mode = priceScale.getMode(): PriceScaleMode;
```

### setMode(mode)

Sets the price scale mode.

```typescript
priceScale.setMode(mode: PriceScaleMode): void;
```

### isInverted()

Returns whether the scale is inverted.

```typescript
const inverted = priceScale.isInverted(): boolean;
```

### setInverted(inverted)

Sets whether the scale is inverted.

```typescript
priceScale.setInverted(inverted: boolean): void;
```

### getVisiblePriceRange()

Returns the visible price range.

```typescript
const range = priceScale.getVisiblePriceRange(): PriceRange | null;

interface PriceRange {
    from: number;
    to: number;
}
```

### setVisiblePriceRange(range)

Sets the visible price range.

```typescript
priceScale.setVisiblePriceRange(range: PriceRange): void;
```

### autoScale()

Enables auto-scaling.

```typescript
priceScale.autoScale(): void;
```

## Event Subscriptions

### subscribeCrosshairMove(handler)

Subscribes to crosshair move events.

```typescript
chart.subscribeCrosshairMove(handler: MouseEventHandler): void;

interface MouseEventParams {
    time?: Time;
    logical?: number;
    point?: Point;
    seriesData: Map<ISeriesApi, BarData | LineData>;
    hoveredSeries?: ISeriesApi;
    hoveredObjectId?: string;
}
```

### unsubscribeCrosshairMove(handler)

Unsubscribes from crosshair move events.

```typescript
chart.unsubscribeCrosshairMove(handler: MouseEventHandler): void;
```

### subscribeClick(handler)

Subscribes to click events.

```typescript
chart.subscribeClick(handler: MouseEventHandler): void;
```

### unsubscribeClick(handler)

Unsubscribes from click events.

```typescript
chart.unsubscribeClick(handler: MouseEventHandler): void;
```

### subscribeVisibleTimeRangeChange(handler)

Subscribes to visible time range changes.

```typescript
timeScale.subscribeVisibleTimeRangeChange(handler: () => void): void;
```

### unsubscribeVisibleTimeRangeChange(handler)

Unsubscribes from visible time range changes.

```typescript
timeScale.unsubscribeVisibleTimeRangeChange(handler: () => void): void;
```

### subscribeVisibleLogicalRangeChange(handler)

Subscribes to visible logical range changes.

```typescript
timeScale.subscribeVisibleLogicalRangeChange(handler: (range: LogicalRange | null) => void): void;
```

### unsubscribeVisibleLogicalRangeChange(handler)

Unsubscribes from visible logical range changes.

```typescript
timeScale.unsubscribeVisibleLogicalRangeChange(handler: (range: LogicalRange | null) => void): void;
```

### subscribeSizeChange(handler)

Subscribes to size changes.

```typescript
timeScale.subscribeSizeChange(handler: () => void): void;
```

### unsubscribeSizeChange(handler)

Unsubscribes from size changes.

```typescript
timeScale.unsubscribeSizeChange(handler: () => void): void;
```

## Types

### Time

```typescript
type Time = UTCTimestamp | BusinessDay | string;

type UTCTimestamp = number;

interface BusinessDay {
    year: number;
    month: number;
    day: number;
}
```

### Point

```typescript
interface Point {
    x: number;
    y: number;
}
```

### SeriesOptionsCommon

```typescript
interface SeriesOptionsCommon {
    title?: string;
    visible?: boolean;
    priceScaleId?: string;
    priceLineVisible?: boolean;
    priceLineSource?: PriceLineSource;
    priceLineWidth?: number;
    priceLineColor?: string;
    priceLineStyle?: LineStyle;
    priceFormat?: PriceFormat;
    baseLineVisible?: boolean;
    baseLineColor?: string;
    baseLineWidth?: number;
    baseLineStyle?: LineStyle;
    lastValueVisible?: boolean;
    autoscaleInfoProvider?: AutoscaleInfoProvider;
}
```

### PriceFormat

```typescript
interface PriceFormat {
    type: 'price' | 'volume' | 'percent' | 'custom';
    precision?: number;
    minMove?: number;
    formatter?: (price: number) => string;
}
```

## React Hooks Pattern

### Custom Hook Example

```typescript
import { useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';

export function useChart(
    containerRef: React.RefObject<HTMLDivElement>,
    options?: ChartOptions
): IChartApi | null {
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (containerRef.current && !chartRef.current) {
            chartRef.current = createChart(containerRef.current, options);
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [containerRef, options]);

    return chartRef.current;
}
```

## Version Information

Current version: 4.x.x (as of 2024)

For the latest API documentation and updates, visit:
https://tradingview.github.io/lightweight-charts/