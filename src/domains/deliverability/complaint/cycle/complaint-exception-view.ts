import { ComplaintException } from "./complaint-exception.js";

/** How screens and exports show a complaint exception. */
export class ComplaintExceptionView {
  code: string;
  name: string;
  priority: string;
  cost: string;
  statusLabel: string;

  constructor(code: string, name: string, priority: string, cost: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintExceptionView(item: ComplaintException): ComplaintExceptionView {
  return new ComplaintExceptionView(
    item.code,
    item.name,
    String(item.priority),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintExceptionViews(items: ComplaintException[]): ComplaintExceptionView[] {
  const views: ComplaintExceptionView[] = [];
  for (const item of items) {
    views.push(toComplaintExceptionView(item));
  }
  return views;
}

export function sumComplaintExceptionView(view: ComplaintExceptionView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedPriority + parsedCost;
}
