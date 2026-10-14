import * as text from "../../../../kit/text.js";
import { DefaultCreativeThreshold } from "./default-creative-threshold.js";

/** How screens and exports show a default creative threshold. */
export class DefaultCreativeThresholdView {
  codeText: string;
  label: string;
  currency: string;
  approvedText: string;
  openRate: string;
  externalRef: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    currency: string,
    approvedText: string,
    openRate: string,
    externalRef: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.currency = currency;
    this.approvedText = approvedText;
    this.openRate = openRate;
    this.externalRef = externalRef;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultCreativeThresholdView(item: DefaultCreativeThreshold): DefaultCreativeThresholdView {
  return new DefaultCreativeThresholdView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    item.currency,
    `${item.approved}`,
    item.openRate.toFixed(2),
    item.externalRef,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultCreativeThresholdViews(items: DefaultCreativeThreshold[]): DefaultCreativeThresholdView[] {
  const views: DefaultCreativeThresholdView[] = [];
  for (const item of items) {
    views.push(toDefaultCreativeThresholdView(item));
  }
  return views;
}

export function sumDefaultCreativeThresholdView(view: DefaultCreativeThresholdView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedOpenRate + parsedImpressions;
}
