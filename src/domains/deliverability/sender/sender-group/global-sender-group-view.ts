import { GlobalSenderGroup } from "./global-sender-group.js";

/** How screens and exports show a global sender group. */
export class GlobalSenderGroupView {
  code: string;
  label: string;
  impressions: string;
  archived: string;
  marginText: string;
  budget: string;
  currency: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    impressions: string,
    archived: string,
    marginText: string,
    budget: string,
    currency: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.archived = archived;
    this.marginText = marginText;
    this.budget = budget;
    this.currency = currency;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSenderGroupView(item: GlobalSenderGroup): GlobalSenderGroupView {
  return new GlobalSenderGroupView(
    item.code,
    item.label,
    String(item.impressions),
    `${item.archived}`,
    item.margin.toFixed(2),
    item.budget.toFixed(2),
    item.currency,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSenderGroupViews(items: GlobalSenderGroup[]): GlobalSenderGroupView[] {
  const views: GlobalSenderGroupView[] = [];
  for (const item of items) {
    views.push(toGlobalSenderGroupView(item));
  }
  return views;
}

export function sumGlobalSenderGroupView(view: GlobalSenderGroupView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedImpressions + parsedMargin + parsedBudget;
}
