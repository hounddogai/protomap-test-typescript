import { PendingExitRuleItem } from "./pending-exit-rule-item.js";

/** How screens and exports show a pending exit rule item. */
export class PendingExitRuleItemView {
  code: string;
  labelText: string;
  batchSizeText: string;
  reviewer: string;
  openRate: string;
  country: string;
  active: string;
  costText: string;
  frequencyCapText: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    batchSizeText: string,
    reviewer: string,
    openRate: string,
    country: string,
    active: string,
    costText: string,
    frequencyCapText: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.batchSizeText = batchSizeText;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.country = country;
    this.active = active;
    this.costText = costText;
    this.frequencyCapText = frequencyCapText;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toPendingExitRuleItemView(item: PendingExitRuleItem): PendingExitRuleItemView {
  return new PendingExitRuleItemView(
    item.code,
    item.label,
    String(item.batchSize),
    item.reviewer,
    item.openRate.toFixed(2),
    item.country,
    `${item.active}`,
    item.cost.toFixed(2),
    String(item.frequencyCap),
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingExitRuleItemViews(items: PendingExitRuleItem[]): PendingExitRuleItemView[] {
  const views: PendingExitRuleItemView[] = [];
  for (const item of items) {
    views.push(toPendingExitRuleItemView(item));
  }
  return views;
}

export function sumPendingExitRuleItemView(view: PendingExitRuleItemView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedBatchSize + parsedOpenRate + parsedCost;
}
