import * as text from "../../../../kit/text.js";
import { PaywallBudget } from "./paywall-budget.js";

/** How screens and exports show a paywall budget. */
export class PaywallBudgetView {
  code: string;
  name: string;
  approved: string;
  score: string;
  audienceId: string;
  graceDays: string;
  sequenceText: string;
  batchSize: string;
  label: string;
  externalRefText: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    approved: string,
    score: string,
    audienceId: string,
    graceDays: string,
    sequenceText: string,
    batchSize: string,
    label: string,
    externalRefText: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.score = score;
    this.audienceId = audienceId;
    this.graceDays = graceDays;
    this.sequenceText = sequenceText;
    this.batchSize = batchSize;
    this.label = label;
    this.externalRefText = externalRefText;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallBudgetView(item: PaywallBudget): PaywallBudgetView {
  return new PaywallBudgetView(
    item.code,
    item.name,
    `${item.approved}`,
    item.score.toFixed(2),
    item.audienceId,
    String(item.graceDays),
    String(item.sequence),
    String(item.batchSize),
    item.label,
    text.truncate(item.externalRef, 120),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallBudgetViews(items: PaywallBudget[]): PaywallBudgetView[] {
  const views: PaywallBudgetView[] = [];
  for (const item of items) {
    views.push(toPaywallBudgetView(item));
  }
  return views;
}

export function sumPaywallBudgetView(view: PaywallBudgetView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedScore + parsedGraceDays + parsedSequence;
}
