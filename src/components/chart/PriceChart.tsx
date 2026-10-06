"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/types/market";

export default function PriceChart({
  candles,
  variant,
}: {
  candles: Candle[];
  variant: "candles" | "area";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      const chart = createChart(container, {
        width: container.clientWidth,
        height: 320,
        layout: {
          background: { type: ColorType.Solid, color: "#12191b" },
          textColor: "#a0adae",
          fontFamily: getComputedStyle(container).fontFamily,
          fontSize: 12,
          attributionLogo: true,
        },
        grid: {
          vertLines: { color: "#ffffff04" },
          horzLines: { color: "#ffffff09" },
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: { top: 0.12, bottom: 0.23 },
        },
        timeScale: {
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 3,
        },
        crosshair: {
          vertLine: { color: "#c5e98766", labelBackgroundColor: "#35442b" },
          horzLine: { color: "#c5e98766", labelBackgroundColor: "#35442b" },
        },
        handleScroll: {
          mouseWheel: false,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: false,
        },
        handleScale: {
          mouseWheel: false,
          pinch: true,
          axisPressedMouseMove: true,
        },
      });
      if (variant === "candles") {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: "#b3d889",
          downColor: "#d78081",
          borderVisible: false,
          wickUpColor: "#b3d889",
          wickDownColor: "#d78081",
        });
        series.setData(
          candles.map((candle) => ({
            ...candle,
            time: candle.time as UTCTimestamp,
          })),
        );
      } else {
        const series = chart.addSeries(AreaSeries, {
          lineColor: "#c5e987",
          topColor: "#c5e98725",
          bottomColor: "#c5e98700",
          lineWidth: 2,
        });
        series.setData(
          candles.map((candle) => ({
            time: candle.time as UTCTimestamp,
            value: candle.close,
          })),
        );
      }
      const volume = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      volume
        .priceScale()
        .applyOptions({ scaleMargins: { top: 0.84, bottom: 0 } });
      volume.setData(
        candles.map((candle) => ({
          time: candle.time as UTCTimestamp,
          value: candle.volume,
          color: candle.close >= candle.open ? "#b3d88922" : "#d7808122",
        })),
      );
      chart.timeScale().fitContent();
      const observer = new ResizeObserver(() =>
        chart.applyOptions({ width: container.clientWidth }),
      );
      observer.observe(container);
      cleanup = () => {
        observer.disconnect();
        chart.remove();
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [candles, variant]);

  return <div ref={containerRef} className="price-chart" />;
}
