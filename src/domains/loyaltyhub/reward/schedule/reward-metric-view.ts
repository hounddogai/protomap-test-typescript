import * as text from "../../../../kit/text.js";
import { RewardMetric } from "./reward-metric.js";

/** How screens and exports show a reward metric. */
export class RewardMetricView {
  code: string;
  title: string;
  createdAt: string;
  audienceIdText: string;
  pinned: string;
  country: string;
  contactEmailText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    createdAt: string,
    audienceIdText: string,
    pinned: string,
    country: string,
    contactEmailText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.audienceIdText = audienceIdText;
    this.pinned = pinned;
    this.country = country;
    this.contactEmailText = contactEmailText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardMetricView(item: RewardMetric): RewardMetricView {
  return new RewardMetricView(
    item.code,
    item.title,
    String(item.createdAt),
    item.audienceId,
    `${item.pinned}`,
    text.truncate(item.country, 64),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardMetricViews(items: RewardMetric[]): RewardMetricView[] {
  const views: RewardMetricView[] = [];
  for (const item of items) {
    views.push(toRewardMetricView(item));
  }
  return views;
}

export function sumRewardMetricView(view: RewardMetricView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCreatedAt;
}
