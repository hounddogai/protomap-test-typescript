import * as text from "../../../../kit/text.js";
import { LenientConversionBatch } from "./lenient-conversion-batch.js";

/** How screens and exports show a lenient conversion batch. */
export class LenientConversionBatchView {
  codeText: string;
  titleText: string;
  locale: string;
  country: string;
  impressionsText: string;
  variant: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    locale: string,
    country: string,
    impressionsText: string,
    variant: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.locale = locale;
    this.country = country;
    this.impressionsText = impressionsText;
    this.variant = variant;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toLenientConversionBatchView(item: LenientConversionBatch): LenientConversionBatchView {
  return new LenientConversionBatchView(
    item.code,
    text.truncate(item.title, 40),
    item.locale,
    item.country,
    String(item.impressions),
    text.truncate(item.variant, 40),
    text.truncate(item.reviewer, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientConversionBatchViews(items: LenientConversionBatch[]): LenientConversionBatchView[] {
  const views: LenientConversionBatchView[] = [];
  for (const item of items) {
    views.push(toLenientConversionBatchView(item));
  }
  return views;
}

export function sumLenientConversionBatchView(view: LenientConversionBatchView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedImpressions;
}
