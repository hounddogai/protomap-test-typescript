import * as text from "../../../../kit/text.js";
import { ExitRuleEntry } from "./exit-rule-entry.js";

/** How screens and exports show a exit rule entry. */
export class ExitRuleEntryView {
  code: string;
  label: string;
  region: string;
  maximum: string;
  channel: string;
  phone: string;
  approved: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    region: string,
    maximum: string,
    channel: string,
    phone: string,
    approved: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.maximum = maximum;
    this.channel = channel;
    this.phone = phone;
    this.approved = approved;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleEntryView(item: ExitRuleEntry): ExitRuleEntryView {
  return new ExitRuleEntryView(
    item.code,
    item.label,
    text.truncate(item.region, 80),
    item.maximum.toFixed(2),
    item.channel,
    text.truncate(item.phone, 80),
    `${item.approved}`,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleEntryViews(items: ExitRuleEntry[]): ExitRuleEntryView[] {
  const views: ExitRuleEntryView[] = [];
  for (const item of items) {
    views.push(toExitRuleEntryView(item));
  }
  return views;
}

export function sumExitRuleEntryView(view: ExitRuleEntryView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedMaximum + parsedEndsAt;
}
