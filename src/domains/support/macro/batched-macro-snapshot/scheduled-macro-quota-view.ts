import * as text from "../../../../kit/text.js";
import { ScheduledMacroQuota } from "./scheduled-macro-quota.js";

/** How screens and exports show a scheduled macro quota. */
export class ScheduledMacroQuotaView {
  code: string;
  title: string;
  active: string;
  name: string;
  descriptionText: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    active: string,
    name: string,
    descriptionText: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.name = name;
    this.descriptionText = descriptionText;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledMacroQuotaView(item: ScheduledMacroQuota): ScheduledMacroQuotaView {
  return new ScheduledMacroQuotaView(
    item.code,
    text.truncate(item.title, 80),
    `${item.active}`,
    item.name,
    item.description,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledMacroQuotaViews(items: ScheduledMacroQuota[]): ScheduledMacroQuotaView[] {
  const views: ScheduledMacroQuotaView[] = [];
  for (const item of items) {
    views.push(toScheduledMacroQuotaView(item));
  }
  return views;
}

export function sumScheduledMacroQuotaView(view: ScheduledMacroQuotaView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
