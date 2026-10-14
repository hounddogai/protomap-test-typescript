import { InviteRule } from "./invite-rule.js";

/** How screens and exports show a invite rule. */
export class InviteRuleView {
  code: string;
  nameText: string;
  graceDays: string;
  approvedText: string;
  conversionRate: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    graceDays: string,
    approvedText: string,
    conversionRate: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.graceDays = graceDays;
    this.approvedText = approvedText;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toInviteRuleView(item: InviteRule): InviteRuleView {
  return new InviteRuleView(
    item.code,
    item.name,
    String(item.graceDays),
    `${item.approved}`,
    item.conversionRate.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteRuleViews(items: InviteRule[]): InviteRuleView[] {
  const views: InviteRuleView[] = [];
  for (const item of items) {
    views.push(toInviteRuleView(item));
  }
  return views;
}

export function sumInviteRuleView(view: InviteRuleView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedGraceDays + parsedConversionRate + parsedEndsAt;
}
