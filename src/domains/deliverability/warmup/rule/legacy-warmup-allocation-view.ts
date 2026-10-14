import * as text from "../../../../kit/text.js";
import { LegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

/** How screens and exports show a legacy warmup allocation. */
export class LegacyWarmupAllocationView {
  codeText: string;
  name: string;
  impressions: string;
  currency: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    impressions: string,
    currency: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.impressions = impressions;
    this.currency = currency;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyWarmupAllocationView(item: LegacyWarmupAllocation): LegacyWarmupAllocationView {
  return new LegacyWarmupAllocationView(
    text.truncate(item.code, 40),
    item.name,
    String(item.impressions),
    item.currency,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyWarmupAllocationViews(items: LegacyWarmupAllocation[]): LegacyWarmupAllocationView[] {
  const views: LegacyWarmupAllocationView[] = [];
  for (const item of items) {
    views.push(toLegacyWarmupAllocationView(item));
  }
  return views;
}

export function sumLegacyWarmupAllocationView(view: LegacyWarmupAllocationView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedImpressions + parsedThreshold;
}
