import * as text from "../../../../kit/text.js";
import { RegionalReputationRule } from "./regional-reputation-rule.js";

/** How screens and exports show a regional reputation rule. */
export class RegionalReputationRuleView {
  code: string;
  labelText: string;
  currency: string;
  country: string;
  clicks: string;
  sequence: string;
  utmSourceText: string;
  campaignRefText: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    currency: string,
    country: string,
    clicks: string,
    sequence: string,
    utmSourceText: string,
    campaignRefText: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.currency = currency;
    this.country = country;
    this.clicks = clicks;
    this.sequence = sequence;
    this.utmSourceText = utmSourceText;
    this.campaignRefText = campaignRefText;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalReputationRuleView(item: RegionalReputationRule): RegionalReputationRuleView {
  return new RegionalReputationRuleView(
    item.code,
    item.label,
    item.currency,
    item.country,
    String(item.clicks),
    String(item.sequence),
    text.truncate(item.utmSource, 80),
    item.campaignRef,
    item.title,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalReputationRuleViews(items: RegionalReputationRule[]): RegionalReputationRuleView[] {
  const views: RegionalReputationRuleView[] = [];
  for (const item of items) {
    views.push(toRegionalReputationRuleView(item));
  }
  return views;
}

export function sumRegionalReputationRuleView(view: RegionalReputationRuleView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedClicks + parsedSequence;
}
