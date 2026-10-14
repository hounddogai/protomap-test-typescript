import * as text from "../../../../kit/text.js";
import { TieredRewardSlot } from "./tiered-reward-slot.js";

/** How screens and exports show a tiered reward slot. */
export class TieredRewardSlotView {
  code: string;
  name: string;
  discount: string;
  expiresAt: string;
  notes: string;
  budget: string;
  externalRef: string;
  version: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    discount: string,
    expiresAt: string,
    notes: string,
    budget: string,
    externalRef: string,
    version: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.expiresAt = expiresAt;
    this.notes = notes;
    this.budget = budget;
    this.externalRef = externalRef;
    this.version = version;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardSlotView(item: TieredRewardSlot): TieredRewardSlotView {
  return new TieredRewardSlotView(
    item.code,
    text.truncate(item.name, 64),
    item.discount.toFixed(2),
    String(item.expiresAt),
    text.truncate(item.notes, 120),
    item.budget.toFixed(2),
    text.truncate(item.externalRef, 80),
    String(item.version),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardSlotViews(items: TieredRewardSlot[]): TieredRewardSlotView[] {
  const views: TieredRewardSlotView[] = [];
  for (const item of items) {
    views.push(toTieredRewardSlotView(item));
  }
  return views;
}

export function sumTieredRewardSlotView(view: TieredRewardSlotView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedDiscount + parsedExpiresAt + parsedBudget;
}
