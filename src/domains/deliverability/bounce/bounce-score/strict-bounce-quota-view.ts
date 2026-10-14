import * as text from "../../../../kit/text.js";
import { StrictBounceQuota } from "./strict-bounce-quota.js";

/** How screens and exports show a strict bounce quota. */
export class StrictBounceQuotaView {
  codeText: string;
  nameText: string;
  minimum: string;
  budget: string;
  openRate: string;
  summary: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    minimum: string,
    budget: string,
    openRate: string,
    summary: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.minimum = minimum;
    this.budget = budget;
    this.openRate = openRate;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toStrictBounceQuotaView(item: StrictBounceQuota): StrictBounceQuotaView {
  return new StrictBounceQuotaView(
    item.code,
    text.truncate(item.name, 64),
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictBounceQuotaViews(items: StrictBounceQuota[]): StrictBounceQuotaView[] {
  const views: StrictBounceQuotaView[] = [];
  for (const item of items) {
    views.push(toStrictBounceQuotaView(item));
  }
  return views;
}

export function sumStrictBounceQuotaView(view: StrictBounceQuotaView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedMinimum + parsedBudget + parsedOpenRate;
}
