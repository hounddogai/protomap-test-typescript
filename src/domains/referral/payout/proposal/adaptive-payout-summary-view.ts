import * as text from "../../../../kit/text.js";
import { AdaptivePayoutSummary } from "./adaptive-payout-summary.js";

/** How screens and exports show a adaptive payout summary. */
export class AdaptivePayoutSummaryView {
  codeText: string;
  label: string;
  ownerId: string;
  floorValueText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    ownerId: string,
    floorValueText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.ownerId = ownerId;
    this.floorValueText = floorValueText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePayoutSummaryView(item: AdaptivePayoutSummary): AdaptivePayoutSummaryView {
  return new AdaptivePayoutSummaryView(
    text.truncate(item.code, 40),
    item.label,
    text.truncate(item.ownerId, 64),
    item.floorValue.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePayoutSummaryViews(items: AdaptivePayoutSummary[]): AdaptivePayoutSummaryView[] {
  const views: AdaptivePayoutSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptivePayoutSummaryView(item));
  }
  return views;
}

export function sumAdaptivePayoutSummaryView(view: AdaptivePayoutSummaryView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedFloorValue + parsedImpressions;
}
