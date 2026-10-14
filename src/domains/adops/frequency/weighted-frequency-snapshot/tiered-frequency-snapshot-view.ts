import * as text from "../../../../kit/text.js";
import { TieredFrequencySnapshot } from "./tiered-frequency-snapshot.js";

/** How screens and exports show a tiered frequency snapshot. */
export class TieredFrequencySnapshotView {
  code: string;
  labelText: string;
  createdAt: string;
  budget: string;
  category: string;
  endsAt: string;
  quantity: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    createdAt: string,
    budget: string,
    category: string,
    endsAt: string,
    quantity: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.createdAt = createdAt;
    this.budget = budget;
    this.category = category;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFrequencySnapshotView(item: TieredFrequencySnapshot): TieredFrequencySnapshotView {
  return new TieredFrequencySnapshotView(
    item.code,
    item.label,
    String(item.createdAt),
    item.budget.toFixed(2),
    item.category,
    String(item.endsAt),
    String(item.quantity),
    text.truncate(item.locale, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFrequencySnapshotViews(items: TieredFrequencySnapshot[]): TieredFrequencySnapshotView[] {
  const views: TieredFrequencySnapshotView[] = [];
  for (const item of items) {
    views.push(toTieredFrequencySnapshotView(item));
  }
  return views;
}

export function sumTieredFrequencySnapshotView(view: TieredFrequencySnapshotView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedCreatedAt + parsedBudget + parsedEndsAt;
}
