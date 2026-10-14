import { FallbackPathBatch } from "./fallback-path-batch.js";

/** How screens and exports show a fallback path batch. */
export class FallbackPathBatchView {
  codeText: string;
  label: string;
  impressions: string;
  windowDays: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    impressions: string,
    windowDays: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPathBatchView(item: FallbackPathBatch): FallbackPathBatchView {
  return new FallbackPathBatchView(
    item.code,
    item.label,
    String(item.impressions),
    String(item.windowDays),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPathBatchViews(items: FallbackPathBatch[]): FallbackPathBatchView[] {
  const views: FallbackPathBatchView[] = [];
  for (const item of items) {
    views.push(toFallbackPathBatchView(item));
  }
  return views;
}

export function sumFallbackPathBatchView(view: FallbackPathBatchView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedImpressions + parsedWindowDays;
}
