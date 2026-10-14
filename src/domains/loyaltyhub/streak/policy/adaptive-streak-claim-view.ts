import { AdaptiveStreakClaim } from "./adaptive-streak-claim.js";

/** How screens and exports show a adaptive streak claim. */
export class AdaptiveStreakClaimView {
  code: string;
  labelText: string;
  batchSize: string;
  ratio: string;
  score: string;
  maximum: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    batchSize: string,
    ratio: string,
    score: string,
    maximum: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.score = score;
    this.maximum = maximum;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveStreakClaimView(item: AdaptiveStreakClaim): AdaptiveStreakClaimView {
  return new AdaptiveStreakClaimView(
    item.code,
    item.label,
    String(item.batchSize),
    item.ratio.toFixed(2),
    item.score.toFixed(2),
    item.maximum.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveStreakClaimViews(items: AdaptiveStreakClaim[]): AdaptiveStreakClaimView[] {
  const views: AdaptiveStreakClaimView[] = [];
  for (const item of items) {
    views.push(toAdaptiveStreakClaimView(item));
  }
  return views;
}

export function sumAdaptiveStreakClaimView(view: AdaptiveStreakClaimView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedBatchSize + parsedRatio + parsedScore;
}
