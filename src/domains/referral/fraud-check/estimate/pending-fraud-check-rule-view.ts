import * as text from "../../../../kit/text.js";
import { PendingFraudCheckRule } from "./pending-fraud-check-rule.js";

/** How screens and exports show a pending fraud check rule. */
export class PendingFraudCheckRuleView {
  codeText: string;
  name: string;
  unit: string;
  threshold: string;
  contactEmailText: string;
  timezoneText: string;
  capacityText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    unit: string,
    threshold: string,
    contactEmailText: string,
    timezoneText: string,
    capacityText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.unit = unit;
    this.threshold = threshold;
    this.contactEmailText = contactEmailText;
    this.timezoneText = timezoneText;
    this.capacityText = capacityText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toPendingFraudCheckRuleView(item: PendingFraudCheckRule): PendingFraudCheckRuleView {
  return new PendingFraudCheckRuleView(
    text.truncate(item.code, 120),
    item.name,
    item.unit,
    item.threshold.toFixed(2),
    item.contactEmail,
    item.timezone,
    String(item.capacity),
    text.truncate(item.externalRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingFraudCheckRuleViews(items: PendingFraudCheckRule[]): PendingFraudCheckRuleView[] {
  const views: PendingFraudCheckRuleView[] = [];
  for (const item of items) {
    views.push(toPendingFraudCheckRuleView(item));
  }
  return views;
}

export function sumPendingFraudCheckRuleView(view: PendingFraudCheckRuleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedThreshold + parsedCapacity;
}
