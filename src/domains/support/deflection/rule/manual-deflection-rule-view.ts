import * as text from "../../../../kit/text.js";
import { ManualDeflectionRule } from "./manual-deflection-rule.js";

/** How screens and exports show a manual deflection rule. */
export class ManualDeflectionRuleView {
  code: string;
  title: string;
  contactEmail: string;
  threshold: string;
  cohort: string;
  utmSource: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    threshold: string,
    cohort: string,
    utmSource: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toManualDeflectionRuleView(item: ManualDeflectionRule): ManualDeflectionRuleView {
  return new ManualDeflectionRuleView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    item.contactEmail,
    item.threshold.toFixed(2),
    item.cohort,
    text.truncate(item.utmSource, 40),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualDeflectionRuleViews(items: ManualDeflectionRule[]): ManualDeflectionRuleView[] {
  const views: ManualDeflectionRuleView[] = [];
  for (const item of items) {
    views.push(toManualDeflectionRuleView(item));
  }
  return views;
}

export function sumManualDeflectionRuleView(view: ManualDeflectionRuleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedThreshold + parsedMaximum;
}
