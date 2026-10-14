import * as text from "../../../../kit/text.js";
import { RegionalBounceBudget } from "./regional-bounce-budget.js";

/** How screens and exports show a regional bounce budget. */
export class RegionalBounceBudgetView {
  code: string;
  label: string;
  sequence: string;
  openRate: string;
  batchSize: string;
  sourceText: string;
  marginText: string;
  cohort: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sequence: string,
    openRate: string,
    batchSize: string,
    sourceText: string,
    marginText: string,
    cohort: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.openRate = openRate;
    this.batchSize = batchSize;
    this.sourceText = sourceText;
    this.marginText = marginText;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalBounceBudgetView(item: RegionalBounceBudget): RegionalBounceBudgetView {
  return new RegionalBounceBudgetView(
    item.code,
    text.truncate(item.label, 120),
    String(item.sequence),
    item.openRate.toFixed(2),
    String(item.batchSize),
    text.truncate(item.source, 80),
    item.margin.toFixed(2),
    text.truncate(item.cohort, 120),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalBounceBudgetViews(items: RegionalBounceBudget[]): RegionalBounceBudgetView[] {
  const views: RegionalBounceBudgetView[] = [];
  for (const item of items) {
    views.push(toRegionalBounceBudgetView(item));
  }
  return views;
}

export function sumRegionalBounceBudgetView(view: RegionalBounceBudgetView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedSequence + parsedOpenRate + parsedBatchSize;
}
