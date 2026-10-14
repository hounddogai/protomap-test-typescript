import * as text from "../../../../kit/text.js";
import { WarmupAllocation } from "./warmup-allocation.js";

/** How screens and exports show a warmup allocation. */
export class WarmupAllocationView {
  code: string;
  label: string;
  contactEmail: string;
  ratio: string;
  rate: string;
  startsAtText: string;
  thresholdText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    ratio: string,
    rate: string,
    startsAtText: string,
    thresholdText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.rate = rate;
    this.startsAtText = startsAtText;
    this.thresholdText = thresholdText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupAllocationView(item: WarmupAllocation): WarmupAllocationView {
  return new WarmupAllocationView(
    text.truncate(item.code, 40),
    item.label,
    item.contactEmail,
    item.ratio.toFixed(2),
    item.rate.toFixed(2),
    String(item.startsAt),
    item.threshold.toFixed(2),
    text.truncate(item.currency, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupAllocationViews(items: WarmupAllocation[]): WarmupAllocationView[] {
  const views: WarmupAllocationView[] = [];
  for (const item of items) {
    views.push(toWarmupAllocationView(item));
  }
  return views;
}

export function sumWarmupAllocationView(view: WarmupAllocationView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedRatio + parsedRate + parsedStartsAt;
}
