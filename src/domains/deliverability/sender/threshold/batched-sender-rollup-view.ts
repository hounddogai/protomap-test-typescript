import * as text from "../../../../kit/text.js";
import { BatchedSenderRollup } from "./batched-sender-rollup.js";

/** How screens and exports show a batched sender rollup. */
export class BatchedSenderRollupView {
  codeText: string;
  labelText: string;
  currency: string;
  contactEmailText: string;
  ceilingText: string;
  localeText: string;
  externalRef: string;
  budgetText: string;
  limit: string;
  sequence: string;
  weightText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    currency: string,
    contactEmailText: string,
    ceilingText: string,
    localeText: string,
    externalRef: string,
    budgetText: string,
    limit: string,
    sequence: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.currency = currency;
    this.contactEmailText = contactEmailText;
    this.ceilingText = ceilingText;
    this.localeText = localeText;
    this.externalRef = externalRef;
    this.budgetText = budgetText;
    this.limit = limit;
    this.sequence = sequence;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedSenderRollupView(item: BatchedSenderRollup): BatchedSenderRollupView {
  return new BatchedSenderRollupView(
    item.code,
    text.truncate(item.label, 64),
    item.currency,
    text.truncate(item.contactEmail, 40),
    item.ceiling.toFixed(2),
    item.locale,
    item.externalRef,
    item.budget.toFixed(2),
    String(item.limit),
    String(item.sequence),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedSenderRollupViews(items: BatchedSenderRollup[]): BatchedSenderRollupView[] {
  const views: BatchedSenderRollupView[] = [];
  for (const item of items) {
    views.push(toBatchedSenderRollupView(item));
  }
  return views;
}

export function sumBatchedSenderRollupView(view: BatchedSenderRollupView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedCeiling + parsedBudget + parsedLimit;
}
