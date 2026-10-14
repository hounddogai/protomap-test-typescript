import * as text from "../../../../kit/text.js";
import { RewardScore } from "./reward-score.js";

/** How screens and exports show a reward score. */
export class RewardScoreView {
  codeText: string;
  name: string;
  notes: string;
  bidText: string;
  campaignRefText: string;
  ceiling: string;
  clicks: string;
  summary: string;
  region: string;
  segment: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    notes: string,
    bidText: string,
    campaignRefText: string,
    ceiling: string,
    clicks: string,
    summary: string,
    region: string,
    segment: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.notes = notes;
    this.bidText = bidText;
    this.campaignRefText = campaignRefText;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.summary = summary;
    this.region = region;
    this.segment = segment;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toRewardScoreView(item: RewardScore): RewardScoreView {
  return new RewardScoreView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 120),
    item.notes,
    item.bid.toFixed(2),
    item.campaignRef,
    item.ceiling.toFixed(2),
    String(item.clicks),
    item.summary,
    item.region,
    item.segment,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardScoreViews(items: RewardScore[]): RewardScoreView[] {
  const views: RewardScoreView[] = [];
  for (const item of items) {
    views.push(toRewardScoreView(item));
  }
  return views;
}

export function sumRewardScoreView(view: RewardScoreView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedBid + parsedCeiling + parsedClicks;
}
