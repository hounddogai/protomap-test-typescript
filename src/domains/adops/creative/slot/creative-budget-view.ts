import * as text from "../../../../kit/text.js";
import { CreativeBudget } from "./creative-budget.js";

/** How screens and exports show a creative budget. */
export class CreativeBudgetView {
  code: string;
  name: string;
  windowDays: string;
  checksumText: string;
  budgetText: string;
  createdAt: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    windowDays: string,
    checksumText: string,
    budgetText: string,
    createdAt: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.checksumText = checksumText;
    this.budgetText = budgetText;
    this.createdAt = createdAt;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeBudgetView(item: CreativeBudget): CreativeBudgetView {
  return new CreativeBudgetView(
    text.truncate(item.code, 40),
    item.name,
    String(item.windowDays),
    item.checksum,
    item.budget.toFixed(2),
    String(item.createdAt),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeBudgetViews(items: CreativeBudget[]): CreativeBudgetView[] {
  const views: CreativeBudgetView[] = [];
  for (const item of items) {
    views.push(toCreativeBudgetView(item));
  }
  return views;
}

export function sumCreativeBudgetView(view: CreativeBudgetView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedWindowDays + parsedBudget + parsedCreatedAt;
}
