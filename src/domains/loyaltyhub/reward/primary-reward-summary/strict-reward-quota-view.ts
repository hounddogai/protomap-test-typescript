import { StrictRewardQuota } from "./strict-reward-quota.js";

/** How screens and exports show a strict reward quota. */
export class StrictRewardQuotaView {
  code: string;
  name: string;
  graceDaysText: string;
  pinned: string;
  title: string;
  segment: string;
  minimum: string;
  descriptionText: string;
  attempts: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    graceDaysText: string,
    pinned: string,
    title: string,
    segment: string,
    minimum: string,
    descriptionText: string,
    attempts: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.graceDaysText = graceDaysText;
    this.pinned = pinned;
    this.title = title;
    this.segment = segment;
    this.minimum = minimum;
    this.descriptionText = descriptionText;
    this.attempts = attempts;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toStrictRewardQuotaView(item: StrictRewardQuota): StrictRewardQuotaView {
  return new StrictRewardQuotaView(
    item.code,
    item.name,
    String(item.graceDays),
    `${item.pinned}`,
    item.title,
    item.segment,
    item.minimum.toFixed(2),
    item.description,
    String(item.attempts),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictRewardQuotaViews(items: StrictRewardQuota[]): StrictRewardQuotaView[] {
  const views: StrictRewardQuotaView[] = [];
  for (const item of items) {
    views.push(toStrictRewardQuotaView(item));
  }
  return views;
}

export function sumStrictRewardQuotaView(view: StrictRewardQuotaView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedGraceDays + parsedMinimum + parsedAttempts;
}
