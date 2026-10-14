import * as text from "../../../../kit/text.js";
import { PathQuota } from "./path-quota.js";

/** How screens and exports show a path quota. */
export class PathQuotaView {
  code: string;
  label: string;
  ownerId: string;
  description: string;
  archived: string;
  budgetText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    description: string,
    archived: string,
    budgetText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.description = description;
    this.archived = archived;
    this.budgetText = budgetText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toPathQuotaView(item: PathQuota): PathQuotaView {
  return new PathQuotaView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    item.ownerId,
    item.description,
    `${item.archived}`,
    item.budget.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathQuotaViews(items: PathQuota[]): PathQuotaView[] {
  const views: PathQuotaView[] = [];
  for (const item of items) {
    views.push(toPathQuotaView(item));
  }
  return views;
}

export function sumPathQuotaView(view: PathQuotaView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedBudget + parsedCeiling;
}
