import * as text from "../../../../kit/text.js";
import { ManualProofTier } from "./manual-proof-tier.js";

/** How screens and exports show a manual proof tier. */
export class ManualProofTierView {
  codeText: string;
  title: string;
  amount: string;
  batchSizeText: string;
  channel: string;
  budget: string;
  conversionRate: string;
  startsAt: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    amount: string,
    batchSizeText: string,
    channel: string,
    budget: string,
    conversionRate: string,
    startsAt: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.amount = amount;
    this.batchSizeText = batchSizeText;
    this.channel = channel;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toManualProofTierView(item: ManualProofTier): ManualProofTierView {
  return new ManualProofTierView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    String(item.batchSize),
    text.truncate(item.channel, 80),
    item.budget.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.startsAt),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualProofTierViews(items: ManualProofTier[]): ManualProofTierView[] {
  const views: ManualProofTierView[] = [];
  for (const item of items) {
    views.push(toManualProofTierView(item));
  }
  return views;
}

export function sumManualProofTierView(view: ManualProofTierView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedAmount + parsedBatchSize + parsedBudget;
}
