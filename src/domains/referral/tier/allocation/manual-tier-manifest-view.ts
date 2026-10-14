import { ManualTierManifest } from "./manual-tier-manifest.js";

/** How screens and exports show a manual tier manifest. */
export class ManualTierManifestView {
  code: string;
  label: string;
  bid: string;
  budget: string;
  cost: string;
  active: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    bid: string,
    budget: string,
    cost: string,
    active: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.budget = budget;
    this.cost = cost;
    this.active = active;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toManualTierManifestView(item: ManualTierManifest): ManualTierManifestView {
  return new ManualTierManifestView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    item.budget.toFixed(2),
    item.cost.toFixed(2),
    `${item.active}`,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTierManifestViews(items: ManualTierManifest[]): ManualTierManifestView[] {
  const views: ManualTierManifestView[] = [];
  for (const item of items) {
    views.push(toManualTierManifestView(item));
  }
  return views;
}

export function sumManualTierManifestView(view: ManualTierManifestView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedBid + parsedBudget + parsedCost;
}
