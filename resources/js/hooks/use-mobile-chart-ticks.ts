import { useMemo } from "react";
import { useIsMobile } from "./use-mobile";

/**
 * Thins a categorical chart axis down to ~5 evenly spaced labels (always
 * including the first and last) on mobile, instead of every category;
 * desktop keeps every label. Pass the result to an XAxis as
 * `{...(ticks ? { ticks, interval: 0 } : {})}`.
 */
export function useMobileChartTicks<T extends Record<string, any>>(
  data: T[] | undefined | null,
  xAxisKey: string,
  targetCount: number = 5
): (string | number)[] | undefined {
  const isMobile = useIsMobile();

  return useMemo(() => {
    if (!isMobile || !Array.isArray(data) || data.length <= targetCount) return undefined;
    const lastIndex = data.length - 1;
    const indices = Array.from({ length: targetCount }, (_, i) =>
      Math.round((i * lastIndex) / (targetCount - 1))
    );
    const uniqueIndices = Array.from(new Set(indices));
    return uniqueIndices.map((i) => data[i][xAxisKey]);
  }, [isMobile, data, xAxisKey, targetCount]);
}
