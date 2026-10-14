import * as text from "../../../../kit/text.js";
import { RegionalProofRule } from "./regional-proof-rule.js";

/** How screens and exports show a regional proof rule. */
export class RegionalProofRuleView {
  code: string;
  labelText: string;
  category: string;
  attemptsText: string;
  active: string;
  locale: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    category: string,
    attemptsText: string,
    active: string,
    locale: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.category = category;
    this.attemptsText = attemptsText;
    this.active = active;
    this.locale = locale;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalProofRuleView(item: RegionalProofRule): RegionalProofRuleView {
  return new RegionalProofRuleView(
    item.code,
    item.label,
    text.truncate(item.category, 40),
    String(item.attempts),
    `${item.active}`,
    item.locale,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalProofRuleViews(items: RegionalProofRule[]): RegionalProofRuleView[] {
  const views: RegionalProofRuleView[] = [];
  for (const item of items) {
    views.push(toRegionalProofRuleView(item));
  }
  return views;
}

export function sumRegionalProofRuleView(view: RegionalProofRuleView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedAttempts + parsedImpressions;
}
