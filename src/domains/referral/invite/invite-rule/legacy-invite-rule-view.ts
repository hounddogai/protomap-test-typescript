import * as text from "../../../../kit/text.js";
import { LegacyInviteRule } from "./legacy-invite-rule.js";

/** How screens and exports show a legacy invite rule. */
export class LegacyInviteRuleView {
  codeText: string;
  name: string;
  timezone: string;
  amount: string;
  phone: string;
  unit: string;
  ceiling: string;
  graceDays: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    timezone: string,
    amount: string,
    phone: string,
    unit: string,
    ceiling: string,
    graceDays: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.timezone = timezone;
    this.amount = amount;
    this.phone = phone;
    this.unit = unit;
    this.ceiling = ceiling;
    this.graceDays = graceDays;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyInviteRuleView(item: LegacyInviteRule): LegacyInviteRuleView {
  return new LegacyInviteRuleView(
    text.truncate(item.code, 120),
    item.name,
    item.timezone,
    item.amount.toFixed(2),
    text.truncate(item.phone, 80),
    text.truncate(item.unit, 80),
    item.ceiling.toFixed(2),
    String(item.graceDays),
    text.truncate(item.locale, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyInviteRuleViews(items: LegacyInviteRule[]): LegacyInviteRuleView[] {
  const views: LegacyInviteRuleView[] = [];
  for (const item of items) {
    views.push(toLegacyInviteRuleView(item));
  }
  return views;
}

export function sumLegacyInviteRuleView(view: LegacyInviteRuleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedAmount + parsedCeiling + parsedGraceDays;
}
