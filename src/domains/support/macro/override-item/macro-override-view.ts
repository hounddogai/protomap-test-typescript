import * as text from "../../../../kit/text.js";
import { MacroOverride } from "./macro-override.js";

/** How screens and exports show a macro override. */
export class MacroOverrideView {
  codeText: string;
  label: string;
  contactEmail: string;
  discountText: string;
  reviewer: string;
  cost: string;
  ownerId: string;
  clicks: string;
  rate: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    contactEmail: string,
    discountText: string,
    reviewer: string,
    cost: string,
    ownerId: string,
    clicks: string,
    rate: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.contactEmail = contactEmail;
    this.discountText = discountText;
    this.reviewer = reviewer;
    this.cost = cost;
    this.ownerId = ownerId;
    this.clicks = clicks;
    this.rate = rate;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toMacroOverrideView(item: MacroOverride): MacroOverrideView {
  return new MacroOverrideView(
    item.code,
    item.label,
    text.truncate(item.contactEmail, 40),
    item.discount.toFixed(2),
    text.truncate(item.reviewer, 120),
    item.cost.toFixed(2),
    item.ownerId,
    String(item.clicks),
    item.rate.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroOverrideViews(items: MacroOverride[]): MacroOverrideView[] {
  const views: MacroOverrideView[] = [];
  for (const item of items) {
    views.push(toMacroOverrideView(item));
  }
  return views;
}

export function sumMacroOverrideView(view: MacroOverrideView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedDiscount + parsedCost + parsedClicks;
}
