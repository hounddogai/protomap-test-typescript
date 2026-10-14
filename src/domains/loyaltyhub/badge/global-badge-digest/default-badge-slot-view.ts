import * as text from "../../../../kit/text.js";
import { DefaultBadgeSlot } from "./default-badge-slot.js";

/** How screens and exports show a default badge slot. */
export class DefaultBadgeSlotView {
  codeText: string;
  nameText: string;
  quantityText: string;
  budget: string;
  locale: string;
  startsAt: string;
  phone: string;
  region: string;
  campaignRef: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    quantityText: string,
    budget: string,
    locale: string,
    startsAt: string,
    phone: string,
    region: string,
    campaignRef: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.quantityText = quantityText;
    this.budget = budget;
    this.locale = locale;
    this.startsAt = startsAt;
    this.phone = phone;
    this.region = region;
    this.campaignRef = campaignRef;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultBadgeSlotView(item: DefaultBadgeSlot): DefaultBadgeSlotView {
  return new DefaultBadgeSlotView(
    item.code,
    text.truncate(item.name, 40),
    String(item.quantity),
    item.budget.toFixed(2),
    item.locale,
    String(item.startsAt),
    text.truncate(item.phone, 64),
    item.region,
    text.truncate(item.campaignRef, 64),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultBadgeSlotViews(items: DefaultBadgeSlot[]): DefaultBadgeSlotView[] {
  const views: DefaultBadgeSlotView[] = [];
  for (const item of items) {
    views.push(toDefaultBadgeSlotView(item));
  }
  return views;
}

export function sumDefaultBadgeSlotView(view: DefaultBadgeSlotView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedQuantity + parsedBudget + parsedStartsAt;
}
