import * as text from "../../../../kit/text.js";
import { RollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

/** How screens and exports show a rolling leaderboard audit. */
export class RollingLeaderboardAuditView {
  code: string;
  labelText: string;
  scoreText: string;
  contactEmailText: string;
  amount: string;
  clicks: string;
  category: string;
  variant: string;
  cost: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    scoreText: string,
    contactEmailText: string,
    amount: string,
    clicks: string,
    category: string,
    variant: string,
    cost: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.scoreText = scoreText;
    this.contactEmailText = contactEmailText;
    this.amount = amount;
    this.clicks = clicks;
    this.category = category;
    this.variant = variant;
    this.cost = cost;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toRollingLeaderboardAuditView(item: RollingLeaderboardAudit): RollingLeaderboardAuditView {
  return new RollingLeaderboardAuditView(
    item.code,
    text.truncate(item.label, 40),
    item.score.toFixed(2),
    item.contactEmail,
    item.amount.toFixed(2),
    String(item.clicks),
    item.category,
    text.truncate(item.variant, 120),
    item.cost.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingLeaderboardAuditViews(items: RollingLeaderboardAudit[]): RollingLeaderboardAuditView[] {
  const views: RollingLeaderboardAuditView[] = [];
  for (const item of items) {
    views.push(toRollingLeaderboardAuditView(item));
  }
  return views;
}

export function sumRollingLeaderboardAuditView(view: RollingLeaderboardAuditView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedScore + parsedAmount + parsedClicks;
}
