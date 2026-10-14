import * as text from "../../../../kit/text.js";
import { TieredPreferenceSnapshot } from "./tiered-preference-snapshot.js";

/** How screens and exports show a tiered preference snapshot. */
export class TieredPreferenceSnapshotView {
  code: string;
  name: string;
  bid: string;
  unit: string;
  variantText: string;
  ownerId: string;
  createdAt: string;
  budget: string;
  phoneText: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bid: string,
    unit: string,
    variantText: string,
    ownerId: string,
    createdAt: string,
    budget: string,
    phoneText: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.unit = unit;
    this.variantText = variantText;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
    this.budget = budget;
    this.phoneText = phoneText;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPreferenceSnapshotView(item: TieredPreferenceSnapshot): TieredPreferenceSnapshotView {
  return new TieredPreferenceSnapshotView(
    text.truncate(item.code, 64),
    item.name,
    item.bid.toFixed(2),
    item.unit,
    item.variant,
    text.truncate(item.ownerId, 120),
    String(item.createdAt),
    item.budget.toFixed(2),
    text.truncate(item.phone, 80),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPreferenceSnapshotViews(items: TieredPreferenceSnapshot[]): TieredPreferenceSnapshotView[] {
  const views: TieredPreferenceSnapshotView[] = [];
  for (const item of items) {
    views.push(toTieredPreferenceSnapshotView(item));
  }
  return views;
}

export function sumTieredPreferenceSnapshotView(view: TieredPreferenceSnapshotView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBid + parsedCreatedAt + parsedBudget;
}
