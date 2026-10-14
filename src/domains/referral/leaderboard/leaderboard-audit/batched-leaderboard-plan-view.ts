import * as text from "../../../../kit/text.js";
import { BatchedLeaderboardPlan } from "./batched-leaderboard-plan.js";

/** How screens and exports show a batched leaderboard plan. */
export class BatchedLeaderboardPlanView {
  code: string;
  nameText: string;
  batchSize: string;
  locale: string;
  category: string;
  country: string;
  channel: string;
  campaignRef: string;
  utmSource: string;
  maximumText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    batchSize: string,
    locale: string,
    category: string,
    country: string,
    channel: string,
    campaignRef: string,
    utmSource: string,
    maximumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.batchSize = batchSize;
    this.locale = locale;
    this.category = category;
    this.country = country;
    this.channel = channel;
    this.campaignRef = campaignRef;
    this.utmSource = utmSource;
    this.maximumText = maximumText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedLeaderboardPlanView(item: BatchedLeaderboardPlan): BatchedLeaderboardPlanView {
  return new BatchedLeaderboardPlanView(
    item.code,
    item.name,
    String(item.batchSize),
    text.truncate(item.locale, 80),
    item.category,
    text.truncate(item.country, 40),
    item.channel,
    text.truncate(item.campaignRef, 80),
    text.truncate(item.utmSource, 64),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedLeaderboardPlanViews(items: BatchedLeaderboardPlan[]): BatchedLeaderboardPlanView[] {
  const views: BatchedLeaderboardPlanView[] = [];
  for (const item of items) {
    views.push(toBatchedLeaderboardPlanView(item));
  }
  return views;
}

export function sumBatchedLeaderboardPlanView(view: BatchedLeaderboardPlanView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  return parsedBatchSize + parsedMaximum;
}
