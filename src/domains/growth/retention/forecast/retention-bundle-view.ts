import * as text from "../../../../kit/text.js";
import { RetentionBundle } from "./retention-bundle.js";

/** How screens and exports show a retention bundle. */
export class RetentionBundleView {
  code: string;
  labelText: string;
  nameText: string;
  batchSize: string;
  clicks: string;
  scoreText: string;
  openRate: string;
  campaignRefText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    nameText: string,
    batchSize: string,
    clicks: string,
    scoreText: string,
    openRate: string,
    campaignRefText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.nameText = nameText;
    this.batchSize = batchSize;
    this.clicks = clicks;
    this.scoreText = scoreText;
    this.openRate = openRate;
    this.campaignRefText = campaignRefText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionBundleView(item: RetentionBundle): RetentionBundleView {
  return new RetentionBundleView(
    item.code,
    item.label,
    item.name,
    String(item.batchSize),
    String(item.clicks),
    item.score.toFixed(2),
    item.openRate.toFixed(2),
    item.campaignRef,
    text.truncate(item.variant, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionBundleViews(items: RetentionBundle[]): RetentionBundleView[] {
  const views: RetentionBundleView[] = [];
  for (const item of items) {
    views.push(toRetentionBundleView(item));
  }
  return views;
}

export function sumRetentionBundleView(view: RetentionBundleView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedBatchSize + parsedClicks + parsedScore;
}
