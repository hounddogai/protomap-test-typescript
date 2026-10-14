import { TieredChallengeSummary } from "./tiered-challenge-summary.js";

/** How screens and exports show a tiered challenge summary. */
export class TieredChallengeSummaryView {
  code: string;
  label: string;
  batchSizeText: string;
  cost: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    batchSizeText: string,
    cost: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.batchSizeText = batchSizeText;
    this.cost = cost;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredChallengeSummaryView(item: TieredChallengeSummary): TieredChallengeSummaryView {
  return new TieredChallengeSummaryView(
    item.code,
    item.label,
    String(item.batchSize),
    item.cost.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredChallengeSummaryViews(items: TieredChallengeSummary[]): TieredChallengeSummaryView[] {
  const views: TieredChallengeSummaryView[] = [];
  for (const item of items) {
    views.push(toTieredChallengeSummaryView(item));
  }
  return views;
}

export function sumTieredChallengeSummaryView(view: TieredChallengeSummaryView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedBatchSize + parsedCost + parsedScore;
}
