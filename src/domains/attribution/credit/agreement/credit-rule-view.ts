import { CreditRule } from "./credit-rule.js";

/** How screens and exports show a credit rule. */
export class CreditRuleView {
  code: string;
  label: string;
  audienceIdText: string;
  durationMinutes: string;
  contactEmail: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    audienceIdText: string,
    durationMinutes: string,
    contactEmail: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.audienceIdText = audienceIdText;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toCreditRuleView(item: CreditRule): CreditRuleView {
  return new CreditRuleView(
    item.code,
    item.label,
    item.audienceId,
    String(item.durationMinutes),
    item.contactEmail,
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditRuleViews(items: CreditRule[]): CreditRuleView[] {
  const views: CreditRuleView[] = [];
  for (const item of items) {
    views.push(toCreditRuleView(item));
  }
  return views;
}

export function sumCreditRuleView(view: CreditRuleView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
