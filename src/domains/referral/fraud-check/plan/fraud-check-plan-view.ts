import { FraudCheckPlan } from "./fraud-check-plan.js";

/** How screens and exports show a fraud check plan. */
export class FraudCheckPlanView {
  code: string;
  labelText: string;
  rateText: string;
  visible: string;
  journeyId: string;
  priority: string;
  budget: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    rateText: string,
    visible: string,
    journeyId: string,
    priority: string,
    budget: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.rateText = rateText;
    this.visible = visible;
    this.journeyId = journeyId;
    this.priority = priority;
    this.budget = budget;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toFraudCheckPlanView(item: FraudCheckPlan): FraudCheckPlanView {
  return new FraudCheckPlanView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    `${item.visible}`,
    item.journeyId,
    String(item.priority),
    item.budget.toFixed(2),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toFraudCheckPlanViews(items: FraudCheckPlan[]): FraudCheckPlanView[] {
  const views: FraudCheckPlanView[] = [];
  for (const item of items) {
    views.push(toFraudCheckPlanView(item));
  }
  return views;
}

export function sumFraudCheckPlanView(view: FraudCheckPlanView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRate + parsedPriority + parsedBudget;
}
