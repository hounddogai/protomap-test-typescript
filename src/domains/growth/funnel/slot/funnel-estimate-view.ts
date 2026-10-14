import * as text from "../../../../kit/text.js";
import { FunnelEstimate } from "./funnel-estimate.js";

/** How screens and exports show a funnel estimate. */
export class FunnelEstimateView {
  code: string;
  name: string;
  amount: string;
  attempts: string;
  checksumText: string;
  regionText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    amount: string,
    attempts: string,
    checksumText: string,
    regionText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.attempts = attempts;
    this.checksumText = checksumText;
    this.regionText = regionText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelEstimateView(item: FunnelEstimate): FunnelEstimateView {
  return new FunnelEstimateView(
    text.truncate(item.code, 40),
    item.name,
    item.amount.toFixed(2),
    String(item.attempts),
    item.checksum,
    text.truncate(item.region, 80),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelEstimateViews(items: FunnelEstimate[]): FunnelEstimateView[] {
  const views: FunnelEstimateView[] = [];
  for (const item of items) {
    views.push(toFunnelEstimateView(item));
  }
  return views;
}

export function sumFunnelEstimateView(view: FunnelEstimateView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAmount + parsedAttempts;
}
