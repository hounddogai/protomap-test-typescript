import * as text from "../../../../kit/text.js";
import { SeasonalBadgeSlot } from "./seasonal-badge-slot.js";

/** How screens and exports show a seasonal badge slot. */
export class SeasonalBadgeSlotView {
  code: string;
  name: string;
  archived: string;
  discount: string;
  phone: string;
  statusLabel: string;

  constructor(code: string, name: string, archived: string, discount: string, phone: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.discount = discount;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalBadgeSlotView(item: SeasonalBadgeSlot): SeasonalBadgeSlotView {
  return new SeasonalBadgeSlotView(
    item.code,
    text.truncate(item.name, 40),
    `${item.archived}`,
    item.discount.toFixed(2),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalBadgeSlotViews(items: SeasonalBadgeSlot[]): SeasonalBadgeSlotView[] {
  const views: SeasonalBadgeSlotView[] = [];
  for (const item of items) {
    views.push(toSeasonalBadgeSlotView(item));
  }
  return views;
}

export function sumSeasonalBadgeSlotView(view: SeasonalBadgeSlotView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
