import * as text from "../../../../kit/text.js";
import { StrictInsightRollup } from "./strict-insight-rollup.js";

/** How screens and exports show a strict insight rollup. */
export class StrictInsightRollupView {
  code: string;
  label: string;
  localeText: string;
  graceDays: string;
  audienceId: string;
  attempts: string;
  currencyText: string;
  batchSize: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    graceDays: string,
    audienceId: string,
    attempts: string,
    currencyText: string,
    batchSize: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.graceDays = graceDays;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.currencyText = currencyText;
    this.batchSize = batchSize;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toStrictInsightRollupView(item: StrictInsightRollup): StrictInsightRollupView {
  return new StrictInsightRollupView(
    item.code,
    text.truncate(item.label, 40),
    text.truncate(item.locale, 120),
    String(item.graceDays),
    text.truncate(item.audienceId, 120),
    String(item.attempts),
    item.currency,
    String(item.batchSize),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictInsightRollupViews(items: StrictInsightRollup[]): StrictInsightRollupView[] {
  const views: StrictInsightRollupView[] = [];
  for (const item of items) {
    views.push(toStrictInsightRollupView(item));
  }
  return views;
}

export function sumStrictInsightRollupView(view: StrictInsightRollupView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedGraceDays + parsedAttempts + parsedBatchSize;
}
