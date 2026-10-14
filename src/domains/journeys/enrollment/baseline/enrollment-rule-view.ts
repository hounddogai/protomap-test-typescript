import * as text from "../../../../kit/text.js";
import { EnrollmentRule } from "./enrollment-rule.js";

/** How screens and exports show a enrollment rule. */
export class EnrollmentRuleView {
  code: string;
  label: string;
  unitText: string;
  revision: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    unitText: string,
    revision: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.unitText = unitText;
    this.revision = revision;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentRuleView(item: EnrollmentRule): EnrollmentRuleView {
  return new EnrollmentRuleView(
    text.truncate(item.code, 40),
    item.label,
    item.unit,
    String(item.revision),
    text.truncate(item.region, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentRuleViews(items: EnrollmentRule[]): EnrollmentRuleView[] {
  const views: EnrollmentRuleView[] = [];
  for (const item of items) {
    views.push(toEnrollmentRuleView(item));
  }
  return views;
}

export function sumEnrollmentRuleView(view: EnrollmentRuleView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
