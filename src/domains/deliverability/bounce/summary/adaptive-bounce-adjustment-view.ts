import * as text from "../../../../kit/text.js";
import { AdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

/** How screens and exports show a adaptive bounce adjustment. */
export class AdaptiveBounceAdjustmentView {
  code: string;
  label: string;
  openRate: string;
  endsAtText: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRate: string,
    endsAtText: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.endsAtText = endsAtText;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBounceAdjustmentView(item: AdaptiveBounceAdjustment): AdaptiveBounceAdjustmentView {
  return new AdaptiveBounceAdjustmentView(
    item.code,
    text.truncate(item.label, 120),
    item.openRate.toFixed(2),
    String(item.endsAt),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBounceAdjustmentViews(items: AdaptiveBounceAdjustment[]): AdaptiveBounceAdjustmentView[] {
  const views: AdaptiveBounceAdjustmentView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBounceAdjustmentView(item));
  }
  return views;
}

export function sumAdaptiveBounceAdjustmentView(view: AdaptiveBounceAdjustmentView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedOpenRate + parsedEndsAt;
}
