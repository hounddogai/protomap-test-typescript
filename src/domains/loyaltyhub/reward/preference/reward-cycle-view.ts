import * as text from "../../../../kit/text.js";
import { RewardCycle } from "./reward-cycle.js";

/** How screens and exports show a reward cycle. */
export class RewardCycleView {
  codeText: string;
  titleText: string;
  weight: string;
  scoreText: string;
  label: string;
  timezone: string;
  bid: string;
  graceDays: string;
  sendAt: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    weight: string,
    scoreText: string,
    label: string,
    timezone: string,
    bid: string,
    graceDays: string,
    sendAt: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.weight = weight;
    this.scoreText = scoreText;
    this.label = label;
    this.timezone = timezone;
    this.bid = bid;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardCycleView(item: RewardCycle): RewardCycleView {
  return new RewardCycleView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 120),
    item.weight.toFixed(2),
    item.score.toFixed(2),
    item.label,
    item.timezone,
    item.bid.toFixed(2),
    String(item.graceDays),
    String(item.sendAt),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardCycleViews(items: RewardCycle[]): RewardCycleView[] {
  const views: RewardCycleView[] = [];
  for (const item of items) {
    views.push(toRewardCycleView(item));
  }
  return views;
}

export function sumRewardCycleView(view: RewardCycleView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedWeight + parsedScore + parsedBid;
}
