import { SubscriptionProfile } from "./subscription-profile.js";

/** How screens and exports show a subscription profile. */
export class SubscriptionProfileView {
  codeText: string;
  name: string;
  score: string;
  approved: string;
  unit: string;
  channel: string;
  rateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    score: string,
    approved: string,
    unit: string,
    channel: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.score = score;
    this.approved = approved;
    this.unit = unit;
    this.channel = channel;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionProfileView(item: SubscriptionProfile): SubscriptionProfileView {
  return new SubscriptionProfileView(
    item.code,
    item.name,
    item.score.toFixed(2),
    `${item.approved}`,
    item.unit,
    item.channel,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionProfileViews(items: SubscriptionProfile[]): SubscriptionProfileView[] {
  const views: SubscriptionProfileView[] = [];
  for (const item of items) {
    views.push(toSubscriptionProfileView(item));
  }
  return views;
}

export function sumSubscriptionProfileView(view: SubscriptionProfileView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedScore + parsedRate;
}
