import * as text from "../../../../kit/text.js";
import { TieredModelTier } from "./tiered-model-tier.js";

/** How screens and exports show a tiered model tier. */
export class TieredModelTierView {
  codeText: string;
  name: string;
  category: string;
  priorityText: string;
  notes: string;
  countryText: string;
  graceDays: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    category: string,
    priorityText: string,
    notes: string,
    countryText: string,
    graceDays: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.category = category;
    this.priorityText = priorityText;
    this.notes = notes;
    this.countryText = countryText;
    this.graceDays = graceDays;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredModelTierView(item: TieredModelTier): TieredModelTierView {
  return new TieredModelTierView(
    text.truncate(item.code, 64),
    item.name,
    item.category,
    String(item.priority),
    item.notes,
    item.country,
    String(item.graceDays),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredModelTierViews(items: TieredModelTier[]): TieredModelTierView[] {
  const views: TieredModelTierView[] = [];
  for (const item of items) {
    views.push(toTieredModelTierView(item));
  }
  return views;
}

export function sumTieredModelTierView(view: TieredModelTierView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedPriority + parsedGraceDays + parsedExpiresAt;
}
