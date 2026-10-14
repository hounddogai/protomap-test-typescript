import * as text from "../../../../kit/text.js";
import { ExitRuleDigest } from "./exit-rule-digest.js";

/** How screens and exports show a exit rule digest. */
export class ExitRuleDigestView {
  code: string;
  label: string;
  ownerIdText: string;
  currency: string;
  contactEmail: string;
  openRateText: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerIdText: string,
    currency: string,
    contactEmail: string,
    openRateText: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerIdText = ownerIdText;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.openRateText = openRateText;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleDigestView(item: ExitRuleDigest): ExitRuleDigestView {
  return new ExitRuleDigestView(
    item.code,
    item.label,
    text.truncate(item.ownerId, 40),
    item.currency,
    item.contactEmail,
    item.openRate.toFixed(2),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleDigestViews(items: ExitRuleDigest[]): ExitRuleDigestView[] {
  const views: ExitRuleDigestView[] = [];
  for (const item of items) {
    views.push(toExitRuleDigestView(item));
  }
  return views;
}

export function sumExitRuleDigestView(view: ExitRuleDigestView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedOpenRate;
}
