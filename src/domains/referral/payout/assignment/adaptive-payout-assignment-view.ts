import { AdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

/** How screens and exports show a adaptive payout assignment. */
export class AdaptivePayoutAssignmentView {
  code: string;
  title: string;
  batchSize: string;
  expiresAtText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    batchSize: string,
    expiresAtText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.expiresAtText = expiresAtText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptivePayoutAssignmentView(item: AdaptivePayoutAssignment): AdaptivePayoutAssignmentView {
  return new AdaptivePayoutAssignmentView(
    item.code,
    item.title,
    String(item.batchSize),
    String(item.expiresAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptivePayoutAssignmentViews(items: AdaptivePayoutAssignment[]): AdaptivePayoutAssignmentView[] {
  const views: AdaptivePayoutAssignmentView[] = [];
  for (const item of items) {
    views.push(toAdaptivePayoutAssignmentView(item));
  }
  return views;
}

export function sumAdaptivePayoutAssignmentView(view: AdaptivePayoutAssignmentView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBatchSize + parsedExpiresAt + parsedBudget;
}
