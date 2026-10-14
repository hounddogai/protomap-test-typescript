import * as text from "../../../../kit/text.js";
import { RollingFraudCheckTier } from "./rolling-fraud-check-tier.js";

/** How screens and exports show a rolling fraud check tier. */
export class RollingFraudCheckTierView {
  codeText: string;
  name: string;
  category: string;
  score: string;
  graceDays: string;
  sendAt: string;
  country: string;
  discountText: string;
  ceiling: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    category: string,
    score: string,
    graceDays: string,
    sendAt: string,
    country: string,
    discountText: string,
    ceiling: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.category = category;
    this.score = score;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.country = country;
    this.discountText = discountText;
    this.ceiling = ceiling;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFraudCheckTierView(item: RollingFraudCheckTier): RollingFraudCheckTierView {
  return new RollingFraudCheckTierView(
    item.code,
    text.truncate(item.name, 80),
    item.category,
    item.score.toFixed(2),
    String(item.graceDays),
    String(item.sendAt),
    item.country,
    item.discount.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFraudCheckTierViews(items: RollingFraudCheckTier[]): RollingFraudCheckTierView[] {
  const views: RollingFraudCheckTierView[] = [];
  for (const item of items) {
    views.push(toRollingFraudCheckTierView(item));
  }
  return views;
}

export function sumRollingFraudCheckTierView(view: RollingFraudCheckTierView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedScore + parsedGraceDays + parsedSendAt;
}
