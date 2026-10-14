import { BatchedPostOverride } from "./batched-post-override.js";

/** How screens and exports show a batched post override. */
export class BatchedPostOverrideView {
  codeText: string;
  label: string;
  amountText: string;
  budget: string;
  openRate: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    amountText: string,
    budget: string,
    openRate: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.amountText = amountText;
    this.budget = budget;
    this.openRate = openRate;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPostOverrideView(item: BatchedPostOverride): BatchedPostOverrideView {
  return new BatchedPostOverrideView(
    item.code,
    item.label,
    item.amount.toFixed(2),
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPostOverrideViews(items: BatchedPostOverride[]): BatchedPostOverrideView[] {
  const views: BatchedPostOverrideView[] = [];
  for (const item of items) {
    views.push(toBatchedPostOverrideView(item));
  }
  return views;
}

export function sumBatchedPostOverrideView(view: BatchedPostOverrideView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedAmount + parsedBudget + parsedOpenRate;
}
