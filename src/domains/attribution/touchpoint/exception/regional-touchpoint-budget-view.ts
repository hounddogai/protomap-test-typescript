import * as text from "../../../../kit/text.js";
import { RegionalTouchpointBudget } from "./regional-touchpoint-budget.js";

/** How screens and exports show a regional touchpoint budget. */
export class RegionalTouchpointBudgetView {
  code: string;
  titleText: string;
  quantity: string;
  version: string;
  description: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    quantity: string,
    version: string,
    description: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.quantity = quantity;
    this.version = version;
    this.description = description;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalTouchpointBudgetView(item: RegionalTouchpointBudget): RegionalTouchpointBudgetView {
  return new RegionalTouchpointBudgetView(
    text.truncate(item.code, 120),
    item.title,
    String(item.quantity),
    String(item.version),
    text.truncate(item.description, 40),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalTouchpointBudgetViews(items: RegionalTouchpointBudget[]): RegionalTouchpointBudgetView[] {
  const views: RegionalTouchpointBudgetView[] = [];
  for (const item of items) {
    views.push(toRegionalTouchpointBudgetView(item));
  }
  return views;
}

export function sumRegionalTouchpointBudgetView(view: RegionalTouchpointBudgetView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedQuantity + parsedVersion;
}
