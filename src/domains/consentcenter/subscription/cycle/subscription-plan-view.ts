import { SubscriptionPlan } from "./subscription-plan.js";

/** How screens and exports show a subscription plan. */
export class SubscriptionPlanView {
  codeText: string;
  name: string;
  graceDaysText: string;
  cost: string;
  statusLabel: string;

  constructor(codeText: string, name: string, graceDaysText: string, cost: string, statusLabel: string) {
    this.codeText = codeText;
    this.name = name;
    this.graceDaysText = graceDaysText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionPlanView(item: SubscriptionPlan): SubscriptionPlanView {
  return new SubscriptionPlanView(
    item.code,
    item.name,
    String(item.graceDays),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionPlanViews(items: SubscriptionPlan[]): SubscriptionPlanView[] {
  const views: SubscriptionPlanView[] = [];
  for (const item of items) {
    views.push(toSubscriptionPlanView(item));
  }
  return views;
}

export function sumSubscriptionPlanView(view: SubscriptionPlanView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedGraceDays + parsedCost;
}
