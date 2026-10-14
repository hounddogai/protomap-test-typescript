import { BounceException } from "./bounce-exception.js";

/** How screens and exports show a bounce exception. */
export class BounceExceptionView {
  codeText: string;
  label: string;
  priority: string;
  windowDays: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priority: string,
    windowDays: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priority = priority;
    this.windowDays = windowDays;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toBounceExceptionView(item: BounceException): BounceExceptionView {
  return new BounceExceptionView(
    item.code,
    item.label,
    String(item.priority),
    String(item.windowDays),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceExceptionViews(items: BounceException[]): BounceExceptionView[] {
  const views: BounceExceptionView[] = [];
  for (const item of items) {
    views.push(toBounceExceptionView(item));
  }
  return views;
}

export function sumBounceExceptionView(view: BounceExceptionView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedPriority + parsedWindowDays + parsedCost;
}
