import * as text from "../../../../kit/text.js";
import { DefaultOptOutAllocation } from "./default-opt-out-allocation.js";

/** How screens and exports show a default opt out allocation. */
export class DefaultOptOutAllocationView {
  codeText: string;
  label: string;
  rate: string;
  localeText: string;
  timezone: string;
  impressions: string;
  campaignRef: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    rate: string,
    localeText: string,
    timezone: string,
    impressions: string,
    campaignRef: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.rate = rate;
    this.localeText = localeText;
    this.timezone = timezone;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultOptOutAllocationView(item: DefaultOptOutAllocation): DefaultOptOutAllocationView {
  return new DefaultOptOutAllocationView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 40),
    item.rate.toFixed(2),
    item.locale,
    item.timezone,
    String(item.impressions),
    item.campaignRef,
    text.truncate(item.segment, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultOptOutAllocationViews(items: DefaultOptOutAllocation[]): DefaultOptOutAllocationView[] {
  const views: DefaultOptOutAllocationView[] = [];
  for (const item of items) {
    views.push(toDefaultOptOutAllocationView(item));
  }
  return views;
}

export function sumDefaultOptOutAllocationView(view: DefaultOptOutAllocationView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedRate + parsedImpressions;
}
