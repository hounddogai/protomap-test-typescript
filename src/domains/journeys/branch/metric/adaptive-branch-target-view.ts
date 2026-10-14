import { AdaptiveBranchTarget } from "./adaptive-branch-target.js";

/** How screens and exports show a adaptive branch target. */
export class AdaptiveBranchTargetView {
  codeText: string;
  name: string;
  openRate: string;
  cost: string;
  margin: string;
  unit: string;
  revisionText: string;
  active: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    openRate: string,
    cost: string,
    margin: string,
    unit: string,
    revisionText: string,
    active: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.openRate = openRate;
    this.cost = cost;
    this.margin = margin;
    this.unit = unit;
    this.revisionText = revisionText;
    this.active = active;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBranchTargetView(item: AdaptiveBranchTarget): AdaptiveBranchTargetView {
  return new AdaptiveBranchTargetView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    item.cost.toFixed(2),
    item.margin.toFixed(2),
    item.unit,
    String(item.revision),
    `${item.active}`,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBranchTargetViews(items: AdaptiveBranchTarget[]): AdaptiveBranchTargetView[] {
  const views: AdaptiveBranchTargetView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBranchTargetView(item));
  }
  return views;
}

export function sumAdaptiveBranchTargetView(view: AdaptiveBranchTargetView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedOpenRate + parsedCost + parsedMargin;
}
