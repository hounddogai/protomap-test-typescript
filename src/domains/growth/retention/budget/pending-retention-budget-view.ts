import * as text from "../../../../kit/text.js";
import { PendingRetentionBudget } from "./pending-retention-budget.js";

/** How screens and exports show a pending retention budget. */
export class PendingRetentionBudgetView {
  code: string;
  label: string;
  timezone: string;
  attempts: string;
  capacityText: string;
  regionText: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    attempts: string,
    capacityText: string,
    regionText: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.attempts = attempts;
    this.capacityText = capacityText;
    this.regionText = regionText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRetentionBudgetView(item: PendingRetentionBudget): PendingRetentionBudgetView {
  return new PendingRetentionBudgetView(
    text.truncate(item.code, 80),
    item.label,
    item.timezone,
    String(item.attempts),
    String(item.capacity),
    item.region,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRetentionBudgetViews(items: PendingRetentionBudget[]): PendingRetentionBudgetView[] {
  const views: PendingRetentionBudgetView[] = [];
  for (const item of items) {
    views.push(toPendingRetentionBudgetView(item));
  }
  return views;
}

export function sumPendingRetentionBudgetView(view: PendingRetentionBudgetView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedAttempts + parsedCapacity;
}
