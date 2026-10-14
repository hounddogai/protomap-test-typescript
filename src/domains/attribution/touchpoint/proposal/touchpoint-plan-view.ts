import { TouchpointPlan } from "./touchpoint-plan.js";

/** How screens and exports show a touchpoint plan. */
export class TouchpointPlanView {
  code: string;
  title: string;
  quantity: string;
  reviewer: string;
  currency: string;
  cost: string;
  durationMinutesText: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    quantity: string,
    reviewer: string,
    currency: string,
    cost: string,
    durationMinutesText: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.currency = currency;
    this.cost = cost;
    this.durationMinutesText = durationMinutesText;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointPlanView(item: TouchpointPlan): TouchpointPlanView {
  return new TouchpointPlanView(
    item.code,
    item.title,
    String(item.quantity),
    item.reviewer,
    item.currency,
    item.cost.toFixed(2),
    String(item.durationMinutes),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointPlanViews(items: TouchpointPlan[]): TouchpointPlanView[] {
  const views: TouchpointPlanView[] = [];
  for (const item of items) {
    views.push(toTouchpointPlanView(item));
  }
  return views;
}

export function sumTouchpointPlanView(view: TouchpointPlanView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedQuantity + parsedCost + parsedDurationMinutes;
}
