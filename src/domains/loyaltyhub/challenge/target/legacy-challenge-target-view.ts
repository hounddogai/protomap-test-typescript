import { LegacyChallengeTarget } from "./legacy-challenge-target.js";

/** How screens and exports show a legacy challenge target. */
export class LegacyChallengeTargetView {
  code: string;
  title: string;
  priorityText: string;
  quantity: string;
  reviewerText: string;
  locale: string;
  checksumText: string;
  capacity: string;
  sendAt: string;
  graceDays: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    priorityText: string,
    quantity: string,
    reviewerText: string,
    locale: string,
    checksumText: string,
    capacity: string,
    sendAt: string,
    graceDays: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.priorityText = priorityText;
    this.quantity = quantity;
    this.reviewerText = reviewerText;
    this.locale = locale;
    this.checksumText = checksumText;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyChallengeTargetView(item: LegacyChallengeTarget): LegacyChallengeTargetView {
  return new LegacyChallengeTargetView(
    item.code,
    item.title,
    String(item.priority),
    String(item.quantity),
    item.reviewer,
    item.locale,
    item.checksum,
    String(item.capacity),
    String(item.sendAt),
    String(item.graceDays),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyChallengeTargetViews(items: LegacyChallengeTarget[]): LegacyChallengeTargetView[] {
  const views: LegacyChallengeTargetView[] = [];
  for (const item of items) {
    views.push(toLegacyChallengeTargetView(item));
  }
  return views;
}

export function sumLegacyChallengeTargetView(view: LegacyChallengeTargetView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedPriority + parsedQuantity + parsedCapacity;
}
