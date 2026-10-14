import { ManualLevelBudget } from "./manual-level-budget.js";

/** How screens and exports show a manual level budget. */
export class ManualLevelBudgetView {
  codeText: string;
  title: string;
  region: string;
  capacity: string;
  clicksText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    region: string,
    capacity: string,
    clicksText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.region = region;
    this.capacity = capacity;
    this.clicksText = clicksText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toManualLevelBudgetView(item: ManualLevelBudget): ManualLevelBudgetView {
  return new ManualLevelBudgetView(
    item.code,
    item.title,
    item.region,
    String(item.capacity),
    String(item.clicks),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualLevelBudgetViews(items: ManualLevelBudget[]): ManualLevelBudgetView[] {
  const views: ManualLevelBudgetView[] = [];
  for (const item of items) {
    views.push(toManualLevelBudgetView(item));
  }
  return views;
}

export function sumManualLevelBudgetView(view: ManualLevelBudgetView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCapacity + parsedClicks + parsedCreatedAt;
}
