import { ManualPayoutPlan } from "./manual-payout-plan.js";

/** How screens and exports show a manual payout plan. */
export class ManualPayoutPlanView {
  codeText: string;
  name: string;
  country: string;
  budgetText: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    country: string,
    budgetText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.country = country;
    this.budgetText = budgetText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toManualPayoutPlanView(item: ManualPayoutPlan): ManualPayoutPlanView {
  return new ManualPayoutPlanView(
    item.code,
    item.name,
    item.country,
    item.budget.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPayoutPlanViews(items: ManualPayoutPlan[]): ManualPayoutPlanView[] {
  const views: ManualPayoutPlanView[] = [];
  for (const item of items) {
    views.push(toManualPayoutPlanView(item));
  }
  return views;
}

export function sumManualPayoutPlanView(view: ManualPayoutPlanView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedBudget + parsedPriority;
}
