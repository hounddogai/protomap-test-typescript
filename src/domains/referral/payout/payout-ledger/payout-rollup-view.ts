import * as text from "../../../../kit/text.js";
import { PayoutRollup } from "./payout-rollup.js";

/** How screens and exports show a payout rollup. */
export class PayoutRollupView {
  codeText: string;
  labelText: string;
  rate: string;
  timezone: string;
  source: string;
  capacityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    rate: string,
    timezone: string,
    source: string,
    capacityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.rate = rate;
    this.timezone = timezone;
    this.source = source;
    this.capacityText = capacityText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutRollupView(item: PayoutRollup): PayoutRollupView {
  return new PayoutRollupView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    text.truncate(item.timezone, 40),
    text.truncate(item.source, 64),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutRollupViews(items: PayoutRollup[]): PayoutRollupView[] {
  const views: PayoutRollupView[] = [];
  for (const item of items) {
    views.push(toPayoutRollupView(item));
  }
  return views;
}

export function sumPayoutRollupView(view: PayoutRollupView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedRate + parsedCapacity;
}
