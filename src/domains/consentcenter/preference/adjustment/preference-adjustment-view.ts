import * as text from "../../../../kit/text.js";
import { PreferenceAdjustment } from "./preference-adjustment.js";

/** How screens and exports show a preference adjustment. */
export class PreferenceAdjustmentView {
  code: string;
  title: string;
  approvedText: string;
  capacityText: string;
  openRateText: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approvedText: string,
    capacityText: string,
    openRateText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approvedText = approvedText;
    this.capacityText = capacityText;
    this.openRateText = openRateText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceAdjustmentView(item: PreferenceAdjustment): PreferenceAdjustmentView {
  return new PreferenceAdjustmentView(
    item.code,
    text.truncate(item.title, 64),
    `${item.approved}`,
    String(item.capacity),
    item.openRate.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceAdjustmentViews(items: PreferenceAdjustment[]): PreferenceAdjustmentView[] {
  const views: PreferenceAdjustmentView[] = [];
  for (const item of items) {
    views.push(toPreferenceAdjustmentView(item));
  }
  return views;
}

export function sumPreferenceAdjustmentView(view: PreferenceAdjustmentView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedCapacity + parsedOpenRate + parsedRetries;
}
