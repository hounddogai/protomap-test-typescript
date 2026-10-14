import { LevelManifest } from "./level-manifest.js";

/** How screens and exports show a level manifest. */
export class LevelManifestView {
  code: string;
  labelText: string;
  createdAt: string;
  externalRef: string;
  region: string;
  windowDaysText: string;
  cost: string;
  amount: string;
  priority: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    createdAt: string,
    externalRef: string,
    region: string,
    windowDaysText: string,
    cost: string,
    amount: string,
    priority: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.region = region;
    this.windowDaysText = windowDaysText;
    this.cost = cost;
    this.amount = amount;
    this.priority = priority;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toLevelManifestView(item: LevelManifest): LevelManifestView {
  return new LevelManifestView(
    item.code,
    item.label,
    String(item.createdAt),
    item.externalRef,
    item.region,
    String(item.windowDays),
    item.cost.toFixed(2),
    item.amount.toFixed(2),
    String(item.priority),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelManifestViews(items: LevelManifest[]): LevelManifestView[] {
  const views: LevelManifestView[] = [];
  for (const item of items) {
    views.push(toLevelManifestView(item));
  }
  return views;
}

export function sumLevelManifestView(view: LevelManifestView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCreatedAt + parsedWindowDays + parsedCost;
}
