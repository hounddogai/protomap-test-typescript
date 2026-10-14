import { RewardEntry } from "./reward-entry.js";

/** How screens and exports show a reward entry. */
export class RewardEntryView {
  code: string;
  name: string;
  campaignRefText: string;
  budget: string;
  discount: string;
  ownerId: string;
  version: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRefText: string,
    budget: string,
    discount: string,
    ownerId: string,
    version: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRefText = campaignRefText;
    this.budget = budget;
    this.discount = discount;
    this.ownerId = ownerId;
    this.version = version;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toRewardEntryView(item: RewardEntry): RewardEntryView {
  return new RewardEntryView(
    item.code,
    item.name,
    item.campaignRef,
    item.budget.toFixed(2),
    item.discount.toFixed(2),
    item.ownerId,
    String(item.version),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardEntryViews(items: RewardEntry[]): RewardEntryView[] {
  const views: RewardEntryView[] = [];
  for (const item of items) {
    views.push(toRewardEntryView(item));
  }
  return views;
}

export function sumRewardEntryView(view: RewardEntryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedBudget + parsedDiscount + parsedVersion;
}
