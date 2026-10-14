import * as text from "../../../../kit/text.js";
import { LegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

/** How screens and exports show a legacy fraud check rule. */
export class LegacyFraudCheckRuleView {
  code: string;
  title: string;
  contactEmailText: string;
  sendAt: string;
  description: string;
  category: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmailText: string,
    sendAt: string,
    description: string,
    category: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmailText = contactEmailText;
    this.sendAt = sendAt;
    this.description = description;
    this.category = category;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyFraudCheckRuleView(item: LegacyFraudCheckRule): LegacyFraudCheckRuleView {
  return new LegacyFraudCheckRuleView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.contactEmail, 40),
    String(item.sendAt),
    item.description,
    text.truncate(item.category, 40),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyFraudCheckRuleViews(items: LegacyFraudCheckRule[]): LegacyFraudCheckRuleView[] {
  const views: LegacyFraudCheckRuleView[] = [];
  for (const item of items) {
    views.push(toLegacyFraudCheckRuleView(item));
  }
  return views;
}

export function sumLegacyFraudCheckRuleView(view: LegacyFraudCheckRuleView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedSendAt + parsedCeiling;
}
