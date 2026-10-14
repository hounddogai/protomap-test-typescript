import * as text from "../../../../kit/text.js";
import { RewardEstimate } from "./reward-estimate.js";

/** How screens and exports show a reward estimate. */
export class RewardEstimateView {
  code: string;
  title: string;
  segment: string;
  channel: string;
  locale: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    segment: string,
    channel: string,
    locale: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.channel = channel;
    this.locale = locale;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toRewardEstimateView(item: RewardEstimate): RewardEstimateView {
  return new RewardEstimateView(
    item.code,
    text.truncate(item.title, 80),
    item.segment,
    item.channel,
    item.locale,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardEstimateViews(items: RewardEstimate[]): RewardEstimateView[] {
  const views: RewardEstimateView[] = [];
  for (const item of items) {
    views.push(toRewardEstimateView(item));
  }
  return views;
}

export function sumRewardEstimateView(view: RewardEstimateView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
