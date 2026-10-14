import * as text from "../../../../kit/text.js";
import { PrimaryWarmupPolicy } from "./primary-warmup-policy.js";

/** How screens and exports show a primary warmup policy. */
export class PrimaryWarmupPolicyView {
  code: string;
  label: string;
  phoneText: string;
  timezone: string;
  ceiling: string;
  openRateText: string;
  amount: string;
  weight: string;
  countryText: string;
  ownerId: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    phoneText: string,
    timezone: string,
    ceiling: string,
    openRateText: string,
    amount: string,
    weight: string,
    countryText: string,
    ownerId: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.phoneText = phoneText;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.openRateText = openRateText;
    this.amount = amount;
    this.weight = weight;
    this.countryText = countryText;
    this.ownerId = ownerId;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryWarmupPolicyView(item: PrimaryWarmupPolicy): PrimaryWarmupPolicyView {
  return new PrimaryWarmupPolicyView(
    item.code,
    item.label,
    item.phone,
    text.truncate(item.timezone, 80),
    item.ceiling.toFixed(2),
    item.openRate.toFixed(2),
    item.amount.toFixed(2),
    item.weight.toFixed(2),
    item.country,
    text.truncate(item.ownerId, 40),
    text.truncate(item.description, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryWarmupPolicyViews(items: PrimaryWarmupPolicy[]): PrimaryWarmupPolicyView[] {
  const views: PrimaryWarmupPolicyView[] = [];
  for (const item of items) {
    views.push(toPrimaryWarmupPolicyView(item));
  }
  return views;
}

export function sumPrimaryWarmupPolicyView(view: PrimaryWarmupPolicyView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCeiling + parsedOpenRate + parsedAmount;
}
