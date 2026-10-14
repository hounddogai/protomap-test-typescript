import { DefaultBadgeGroup } from "./default-badge-group.js";

/** How screens and exports show a default badge group. */
export class DefaultBadgeGroupView {
  code: string;
  label: string;
  clicks: string;
  amount: string;
  windowDays: string;
  scoreText: string;
  contactEmailText: string;
  expiresAt: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicks: string,
    amount: string,
    windowDays: string,
    scoreText: string,
    contactEmailText: string,
    expiresAt: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.amount = amount;
    this.windowDays = windowDays;
    this.scoreText = scoreText;
    this.contactEmailText = contactEmailText;
    this.expiresAt = expiresAt;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultBadgeGroupView(item: DefaultBadgeGroup): DefaultBadgeGroupView {
  return new DefaultBadgeGroupView(
    item.code,
    item.label,
    String(item.clicks),
    item.amount.toFixed(2),
    String(item.windowDays),
    item.score.toFixed(2),
    item.contactEmail,
    String(item.expiresAt),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultBadgeGroupViews(items: DefaultBadgeGroup[]): DefaultBadgeGroupView[] {
  const views: DefaultBadgeGroupView[] = [];
  for (const item of items) {
    views.push(toDefaultBadgeGroupView(item));
  }
  return views;
}

export function sumDefaultBadgeGroupView(view: DefaultBadgeGroupView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedClicks + parsedAmount + parsedWindowDays;
}
