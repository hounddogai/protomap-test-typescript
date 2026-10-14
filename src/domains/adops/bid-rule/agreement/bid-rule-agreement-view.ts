import * as text from "../../../../kit/text.js";
import { BidRuleAgreement } from "./bid-rule-agreement.js";

/** How screens and exports show a bid rule agreement. */
export class BidRuleAgreementView {
  codeText: string;
  labelText: string;
  score: string;
  costText: string;
  attempts: string;
  audienceIdText: string;
  name: string;
  source: string;
  phone: string;
  localeText: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    score: string,
    costText: string,
    attempts: string,
    audienceIdText: string,
    name: string,
    source: string,
    phone: string,
    localeText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.score = score;
    this.costText = costText;
    this.attempts = attempts;
    this.audienceIdText = audienceIdText;
    this.name = name;
    this.source = source;
    this.phone = phone;
    this.localeText = localeText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleAgreementView(item: BidRuleAgreement): BidRuleAgreementView {
  return new BidRuleAgreementView(
    item.code,
    item.label,
    item.score.toFixed(2),
    item.cost.toFixed(2),
    String(item.attempts),
    item.audienceId,
    item.name,
    item.source,
    item.phone,
    text.truncate(item.locale, 120),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleAgreementViews(items: BidRuleAgreement[]): BidRuleAgreementView[] {
  const views: BidRuleAgreementView[] = [];
  for (const item of items) {
    views.push(toBidRuleAgreementView(item));
  }
  return views;
}

export function sumBidRuleAgreementView(view: BidRuleAgreementView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedScore + parsedCost + parsedAttempts;
}
