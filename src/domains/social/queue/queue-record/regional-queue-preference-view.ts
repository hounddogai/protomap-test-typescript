import { RegionalQueuePreference } from "./regional-queue-preference.js";

/** How screens and exports show a regional queue preference. */
export class RegionalQueuePreferenceView {
  code: string;
  name: string;
  bid: string;
  notes: string;
  ceiling: string;
  thresholdText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bid: string,
    notes: string,
    ceiling: string,
    thresholdText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.notes = notes;
    this.ceiling = ceiling;
    this.thresholdText = thresholdText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalQueuePreferenceView(item: RegionalQueuePreference): RegionalQueuePreferenceView {
  return new RegionalQueuePreferenceView(
    item.code,
    item.name,
    item.bid.toFixed(2),
    item.notes,
    item.ceiling.toFixed(2),
    item.threshold.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalQueuePreferenceViews(items: RegionalQueuePreference[]): RegionalQueuePreferenceView[] {
  const views: RegionalQueuePreferenceView[] = [];
  for (const item of items) {
    views.push(toRegionalQueuePreferenceView(item));
  }
  return views;
}

export function sumRegionalQueuePreferenceView(view: RegionalQueuePreferenceView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedBid + parsedCeiling + parsedThreshold;
}
