import * as text from "../../../../kit/text.js";
import { ExitRuleScore } from "./exit-rule-score.js";

/** How screens and exports show a exit rule score. */
export class ExitRuleScoreView {
  codeText: string;
  nameText: string;
  checksum: string;
  locale: string;
  campaignRef: string;
  contactEmailText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    checksum: string,
    locale: string,
    campaignRef: string,
    contactEmailText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.checksum = checksum;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.contactEmailText = contactEmailText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleScoreView(item: ExitRuleScore): ExitRuleScoreView {
  return new ExitRuleScoreView(
    item.code,
    text.truncate(item.name, 64),
    item.checksum,
    text.truncate(item.locale, 80),
    text.truncate(item.campaignRef, 40),
    item.contactEmail,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleScoreViews(items: ExitRuleScore[]): ExitRuleScoreView[] {
  const views: ExitRuleScoreView[] = [];
  for (const item of items) {
    views.push(toExitRuleScoreView(item));
  }
  return views;
}

export function sumExitRuleScoreView(view: ExitRuleScoreView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
