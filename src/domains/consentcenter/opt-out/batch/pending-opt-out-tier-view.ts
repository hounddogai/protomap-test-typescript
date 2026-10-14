import { PendingOptOutTier } from "./pending-opt-out-tier.js";

/** How screens and exports show a pending opt out tier. */
export class PendingOptOutTierView {
  code: string;
  name: string;
  unit: string;
  attemptsText: string;
  batchSizeText: string;
  margin: string;
  sequence: string;
  startsAtText: string;
  priority: string;
  scoreText: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    attemptsText: string,
    batchSizeText: string,
    margin: string,
    sequence: string,
    startsAtText: string,
    priority: string,
    scoreText: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.attemptsText = attemptsText;
    this.batchSizeText = batchSizeText;
    this.margin = margin;
    this.sequence = sequence;
    this.startsAtText = startsAtText;
    this.priority = priority;
    this.scoreText = scoreText;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingOptOutTierView(item: PendingOptOutTier): PendingOptOutTierView {
  return new PendingOptOutTierView(
    item.code,
    item.name,
    item.unit,
    String(item.attempts),
    String(item.batchSize),
    item.margin.toFixed(2),
    String(item.sequence),
    String(item.startsAt),
    String(item.priority),
    item.score.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingOptOutTierViews(items: PendingOptOutTier[]): PendingOptOutTierView[] {
  const views: PendingOptOutTierView[] = [];
  for (const item of items) {
    views.push(toPendingOptOutTierView(item));
  }
  return views;
}

export function sumPendingOptOutTierView(view: PendingOptOutTierView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedAttempts + parsedBatchSize + parsedMargin;
}
