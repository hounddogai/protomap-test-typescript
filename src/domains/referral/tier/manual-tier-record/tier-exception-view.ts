import { TierException } from "./tier-exception.js";

/** How screens and exports show a tier exception. */
export class TierExceptionView {
  code: string;
  label: string;
  budget: string;
  approvedText: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    budget: string,
    approvedText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.approvedText = approvedText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toTierExceptionView(item: TierException): TierExceptionView {
  return new TierExceptionView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    `${item.approved}`,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierExceptionViews(items: TierException[]): TierExceptionView[] {
  const views: TierExceptionView[] = [];
  for (const item of items) {
    views.push(toTierExceptionView(item));
  }
  return views;
}

export function sumTierExceptionView(view: TierExceptionView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBudget + parsedRetries;
}
