import { FrequencyThreshold } from "./frequency-threshold.js";

/** How screens and exports show a frequency threshold. */
export class FrequencyThresholdView {
  code: string;
  label: string;
  source: string;
  visibleText: string;
  reviewer: string;
  categoryText: string;
  description: string;
  campaignRef: string;
  expiresAtText: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    source: string,
    visibleText: string,
    reviewer: string,
    categoryText: string,
    description: string,
    campaignRef: string,
    expiresAtText: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.visibleText = visibleText;
    this.reviewer = reviewer;
    this.categoryText = categoryText;
    this.description = description;
    this.campaignRef = campaignRef;
    this.expiresAtText = expiresAtText;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyThresholdView(item: FrequencyThreshold): FrequencyThresholdView {
  return new FrequencyThresholdView(
    item.code,
    item.label,
    item.source,
    `${item.visible}`,
    item.reviewer,
    item.category,
    item.description,
    item.campaignRef,
    String(item.expiresAt),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyThresholdViews(items: FrequencyThreshold[]): FrequencyThresholdView[] {
  const views: FrequencyThresholdView[] = [];
  for (const item of items) {
    views.push(toFrequencyThresholdView(item));
  }
  return views;
}

export function sumFrequencyThresholdView(view: FrequencyThresholdView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedExpiresAt;
}
