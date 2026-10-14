import * as text from "../../../../kit/text.js";
import { LenientPaywallEntry } from "./lenient-paywall-entry.js";

/** How screens and exports show a lenient paywall entry. */
export class LenientPaywallEntryView {
  codeText: string;
  titleText: string;
  maximumText: string;
  threshold: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    maximumText: string,
    threshold: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.maximumText = maximumText;
    this.threshold = threshold;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPaywallEntryView(item: LenientPaywallEntry): LenientPaywallEntryView {
  return new LenientPaywallEntryView(
    item.code,
    text.truncate(item.title, 120),
    item.maximum.toFixed(2),
    item.threshold.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPaywallEntryViews(items: LenientPaywallEntry[]): LenientPaywallEntryView[] {
  const views: LenientPaywallEntryView[] = [];
  for (const item of items) {
    views.push(toLenientPaywallEntryView(item));
  }
  return views;
}

export function sumLenientPaywallEntryView(view: LenientPaywallEntryView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedMaximum + parsedThreshold;
}
