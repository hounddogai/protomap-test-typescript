import * as text from "../../../../kit/text.js";
import { TierThreshold } from "./tier-threshold.js";

/** How screens and exports show a tier threshold. */
export class TierThresholdView {
  codeText: string;
  label: string;
  categoryText: string;
  scoreText: string;
  channel: string;
  description: string;
  checksum: string;
  unit: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    categoryText: string,
    scoreText: string,
    channel: string,
    description: string,
    checksum: string,
    unit: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.categoryText = categoryText;
    this.scoreText = scoreText;
    this.channel = channel;
    this.description = description;
    this.checksum = checksum;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toTierThresholdView(item: TierThreshold): TierThresholdView {
  return new TierThresholdView(
    item.code,
    text.truncate(item.label, 80),
    item.category,
    item.score.toFixed(2),
    item.channel,
    item.description,
    item.checksum,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toTierThresholdViews(items: TierThreshold[]): TierThresholdView[] {
  const views: TierThresholdView[] = [];
  for (const item of items) {
    views.push(toTierThresholdView(item));
  }
  return views;
}

export function sumTierThresholdView(view: TierThresholdView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
