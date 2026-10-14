import * as text from "../../../../kit/text.js";
import { RegionalRewardRuleException } from "./regional-reward-rule-exception.js";

/** How screens and exports show a regional reward rule exception. */
export class RegionalRewardRuleExceptionView {
  code: string;
  label: string;
  contactEmailText: string;
  utmSource: string;
  active: string;
  channel: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    contactEmailText: string,
    utmSource: string,
    active: string,
    channel: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmailText = contactEmailText;
    this.utmSource = utmSource;
    this.active = active;
    this.channel = channel;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalRewardRuleExceptionView(item: RegionalRewardRuleException): RegionalRewardRuleExceptionView {
  return new RegionalRewardRuleExceptionView(
    item.code,
    item.label,
    item.contactEmail,
    text.truncate(item.utmSource, 80),
    `${item.active}`,
    item.channel,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalRewardRuleExceptionViews(items: RegionalRewardRuleException[]): RegionalRewardRuleExceptionView[] {
  const views: RegionalRewardRuleExceptionView[] = [];
  for (const item of items) {
    views.push(toRegionalRewardRuleExceptionView(item));
  }
  return views;
}

export function sumRegionalRewardRuleExceptionView(view: RegionalRewardRuleExceptionView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
