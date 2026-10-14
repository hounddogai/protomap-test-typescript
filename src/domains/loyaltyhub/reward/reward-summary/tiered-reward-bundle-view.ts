import * as text from "../../../../kit/text.js";
import { TieredRewardBundle } from "./tiered-reward-bundle.js";

/** How screens and exports show a tiered reward bundle. */
export class TieredRewardBundleView {
  code: string;
  nameText: string;
  phone: string;
  categoryText: string;
  amountText: string;
  retries: string;
  channel: string;
  countryText: string;
  pinned: string;
  endsAt: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    phone: string,
    categoryText: string,
    amountText: string,
    retries: string,
    channel: string,
    countryText: string,
    pinned: string,
    endsAt: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.phone = phone;
    this.categoryText = categoryText;
    this.amountText = amountText;
    this.retries = retries;
    this.channel = channel;
    this.countryText = countryText;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardBundleView(item: TieredRewardBundle): TieredRewardBundleView {
  return new TieredRewardBundleView(
    item.code,
    item.name,
    item.phone,
    text.truncate(item.category, 80),
    item.amount.toFixed(2),
    String(item.retries),
    item.channel,
    item.country,
    `${item.pinned}`,
    String(item.endsAt),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardBundleViews(items: TieredRewardBundle[]): TieredRewardBundleView[] {
  const views: TieredRewardBundleView[] = [];
  for (const item of items) {
    views.push(toTieredRewardBundleView(item));
  }
  return views;
}

export function sumTieredRewardBundleView(view: TieredRewardBundleView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedAmount + parsedRetries + parsedEndsAt;
}
