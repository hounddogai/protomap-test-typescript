import * as text from "../../../../kit/text.js";
import { BidRuleTemplate } from "./bid-rule-template.js";

/** How screens and exports show a bid rule template. */
export class BidRuleTemplateView {
  code: string;
  name: string;
  localeText: string;
  score: string;
  ceilingText: string;
  frequencyCap: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    localeText: string,
    score: string,
    ceilingText: string,
    frequencyCap: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.localeText = localeText;
    this.score = score;
    this.ceilingText = ceilingText;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleTemplateView(item: BidRuleTemplate): BidRuleTemplateView {
  return new BidRuleTemplateView(
    text.truncate(item.code, 120),
    item.name,
    item.locale,
    item.score.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.frequencyCap),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleTemplateViews(items: BidRuleTemplate[]): BidRuleTemplateView[] {
  const views: BidRuleTemplateView[] = [];
  for (const item of items) {
    views.push(toBidRuleTemplateView(item));
  }
  return views;
}

export function sumBidRuleTemplateView(view: BidRuleTemplateView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedScore + parsedCeiling + parsedFrequencyCap;
}
