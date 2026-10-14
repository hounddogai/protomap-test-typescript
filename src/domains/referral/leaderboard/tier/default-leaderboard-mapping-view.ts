import * as text from "../../../../kit/text.js";
import { DefaultLeaderboardMapping } from "./default-leaderboard-mapping.js";

/** How screens and exports show a default leaderboard mapping. */
export class DefaultLeaderboardMappingView {
  code: string;
  name: string;
  sequenceText: string;
  summary: string;
  amount: string;
  region: string;
  threshold: string;
  endsAt: string;
  channel: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    sequenceText: string,
    summary: string,
    amount: string,
    region: string,
    threshold: string,
    endsAt: string,
    channel: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.sequenceText = sequenceText;
    this.summary = summary;
    this.amount = amount;
    this.region = region;
    this.threshold = threshold;
    this.endsAt = endsAt;
    this.channel = channel;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultLeaderboardMappingView(item: DefaultLeaderboardMapping): DefaultLeaderboardMappingView {
  return new DefaultLeaderboardMappingView(
    text.truncate(item.code, 80),
    item.name,
    String(item.sequence),
    item.summary,
    item.amount.toFixed(2),
    item.region,
    item.threshold.toFixed(2),
    String(item.endsAt),
    item.channel,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultLeaderboardMappingViews(items: DefaultLeaderboardMapping[]): DefaultLeaderboardMappingView[] {
  const views: DefaultLeaderboardMappingView[] = [];
  for (const item of items) {
    views.push(toDefaultLeaderboardMappingView(item));
  }
  return views;
}

export function sumDefaultLeaderboardMappingView(view: DefaultLeaderboardMappingView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedSequence + parsedAmount + parsedThreshold;
}
