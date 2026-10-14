import { SuppressionTier } from "./suppression-tier.js";

/** How screens and exports show a suppression tier. */
export class SuppressionTierView {
  codeText: string;
  nameText: string;
  maximumText: string;
  ratio: string;
  impressionsText: string;
  variant: string;
  updatedAtText: string;
  frequencyCap: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    maximumText: string,
    ratio: string,
    impressionsText: string,
    variant: string,
    updatedAtText: string,
    frequencyCap: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.maximumText = maximumText;
    this.ratio = ratio;
    this.impressionsText = impressionsText;
    this.variant = variant;
    this.updatedAtText = updatedAtText;
    this.frequencyCap = frequencyCap;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionTierView(item: SuppressionTier): SuppressionTierView {
  return new SuppressionTierView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    item.ratio.toFixed(2),
    String(item.impressions),
    item.variant,
    String(item.updatedAt),
    String(item.frequencyCap),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionTierViews(items: SuppressionTier[]): SuppressionTierView[] {
  const views: SuppressionTierView[] = [];
  for (const item of items) {
    views.push(toSuppressionTierView(item));
  }
  return views;
}

export function sumSuppressionTierView(view: SuppressionTierView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedMaximum + parsedRatio + parsedImpressions;
}
