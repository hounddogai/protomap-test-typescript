import * as text from "../../../../kit/text.js";
import { CappedConversionBundle } from "./capped-conversion-bundle.js";

/** How screens and exports show a capped conversion bundle. */
export class CappedConversionBundleView {
  code: string;
  label: string;
  clicksText: string;
  thresholdText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicksText: string,
    thresholdText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicksText = clicksText;
    this.thresholdText = thresholdText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedConversionBundleView(item: CappedConversionBundle): CappedConversionBundleView {
  return new CappedConversionBundleView(
    item.code,
    item.label,
    String(item.clicks),
    item.threshold.toFixed(2),
    text.truncate(item.summary, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedConversionBundleViews(items: CappedConversionBundle[]): CappedConversionBundleView[] {
  const views: CappedConversionBundleView[] = [];
  for (const item of items) {
    views.push(toCappedConversionBundleView(item));
  }
  return views;
}

export function sumCappedConversionBundleView(view: CappedConversionBundleView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedClicks + parsedThreshold;
}
