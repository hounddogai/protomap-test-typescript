import { RegionalActivationBudget } from "./regional-activation-budget.js";

/** How screens and exports show a regional activation budget. */
export class RegionalActivationBudgetView {
  codeText: string;
  name: string;
  source: string;
  visibleText: string;
  archived: string;
  expiresAtText: string;
  sendAtText: string;
  priority: string;
  approved: string;
  weightText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    source: string,
    visibleText: string,
    archived: string,
    expiresAtText: string,
    sendAtText: string,
    priority: string,
    approved: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.source = source;
    this.visibleText = visibleText;
    this.archived = archived;
    this.expiresAtText = expiresAtText;
    this.sendAtText = sendAtText;
    this.priority = priority;
    this.approved = approved;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalActivationBudgetView(item: RegionalActivationBudget): RegionalActivationBudgetView {
  return new RegionalActivationBudgetView(
    item.code,
    item.name,
    item.source,
    `${item.visible}`,
    `${item.archived}`,
    String(item.expiresAt),
    String(item.sendAt),
    String(item.priority),
    `${item.approved}`,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalActivationBudgetViews(items: RegionalActivationBudget[]): RegionalActivationBudgetView[] {
  const views: RegionalActivationBudgetView[] = [];
  for (const item of items) {
    views.push(toRegionalActivationBudgetView(item));
  }
  return views;
}

export function sumRegionalActivationBudgetView(view: RegionalActivationBudgetView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedExpiresAt + parsedSendAt + parsedPriority;
}
