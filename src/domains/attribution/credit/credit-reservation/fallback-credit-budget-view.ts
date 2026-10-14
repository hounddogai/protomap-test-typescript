import * as text from "../../../../kit/text.js";
import { FallbackCreditBudget } from "./fallback-credit-budget.js";

/** How screens and exports show a fallback credit budget. */
export class FallbackCreditBudgetView {
  codeText: string;
  label: string;
  phoneText: string;
  reviewerText: string;
  notes: string;
  graceDays: string;
  batchSize: string;
  conversionRateText: string;
  archived: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    phoneText: string,
    reviewerText: string,
    notes: string,
    graceDays: string,
    batchSize: string,
    conversionRateText: string,
    archived: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.phoneText = phoneText;
    this.reviewerText = reviewerText;
    this.notes = notes;
    this.graceDays = graceDays;
    this.batchSize = batchSize;
    this.conversionRateText = conversionRateText;
    this.archived = archived;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreditBudgetView(item: FallbackCreditBudget): FallbackCreditBudgetView {
  return new FallbackCreditBudgetView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.phone, 40),
    text.truncate(item.reviewer, 80),
    item.notes,
    String(item.graceDays),
    String(item.batchSize),
    item.conversionRate.toFixed(2),
    `${item.archived}`,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreditBudgetViews(items: FallbackCreditBudget[]): FallbackCreditBudgetView[] {
  const views: FallbackCreditBudgetView[] = [];
  for (const item of items) {
    views.push(toFallbackCreditBudgetView(item));
  }
  return views;
}

export function sumFallbackCreditBudgetView(view: FallbackCreditBudgetView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedGraceDays + parsedBatchSize + parsedConversionRate;
}
