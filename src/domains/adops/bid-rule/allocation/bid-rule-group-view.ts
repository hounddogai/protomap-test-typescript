import * as text from "../../../../kit/text.js";
import { BidRuleGroup } from "./bid-rule-group.js";

/** How screens and exports show a bid rule group. */
export class BidRuleGroupView {
  code: string;
  titleText: string;
  utmSource: string;
  cohort: string;
  name: string;
  score: string;
  externalRefText: string;
  unitText: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    utmSource: string,
    cohort: string,
    name: string,
    score: string,
    externalRefText: string,
    unitText: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.utmSource = utmSource;
    this.cohort = cohort;
    this.name = name;
    this.score = score;
    this.externalRefText = externalRefText;
    this.unitText = unitText;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleGroupView(item: BidRuleGroup): BidRuleGroupView {
  return new BidRuleGroupView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 64),
    text.truncate(item.utmSource, 120),
    item.cohort,
    item.name,
    item.score.toFixed(2),
    item.externalRef,
    text.truncate(item.unit, 40),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleGroupViews(items: BidRuleGroup[]): BidRuleGroupView[] {
  const views: BidRuleGroupView[] = [];
  for (const item of items) {
    views.push(toBidRuleGroupView(item));
  }
  return views;
}

export function sumBidRuleGroupView(view: BidRuleGroupView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedScore + parsedImpressions;
}
