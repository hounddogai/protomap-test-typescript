import { PrimaryFlightPolicy } from "./primary-flight-policy.js";

/** How screens and exports show a primary flight policy. */
export class PrimaryFlightPolicyView {
  code: string;
  label: string;
  rateText: string;
  channelText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rateText: string,
    channelText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rateText = rateText;
    this.channelText = channelText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFlightPolicyView(item: PrimaryFlightPolicy): PrimaryFlightPolicyView {
  return new PrimaryFlightPolicyView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    item.channel,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFlightPolicyViews(items: PrimaryFlightPolicy[]): PrimaryFlightPolicyView[] {
  const views: PrimaryFlightPolicyView[] = [];
  for (const item of items) {
    views.push(toPrimaryFlightPolicyView(item));
  }
  return views;
}

export function sumPrimaryFlightPolicyView(view: PrimaryFlightPolicyView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedRate + parsedAmount;
}
