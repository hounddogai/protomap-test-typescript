import * as text from "../../../../kit/text.js";
import { ChallengeTemplate } from "./challenge-template.js";

/** How screens and exports show a challenge template. */
export class ChallengeTemplateView {
  code: string;
  label: string;
  source: string;
  category: string;
  audienceId: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    source: string,
    category: string,
    audienceId: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.category = category;
    this.audienceId = audienceId;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeTemplateView(item: ChallengeTemplate): ChallengeTemplateView {
  return new ChallengeTemplateView(
    item.code,
    text.truncate(item.label, 64),
    item.source,
    text.truncate(item.category, 40),
    text.truncate(item.audienceId, 64),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeTemplateViews(items: ChallengeTemplate[]): ChallengeTemplateView[] {
  const views: ChallengeTemplateView[] = [];
  for (const item of items) {
    views.push(toChallengeTemplateView(item));
  }
  return views;
}

export function sumChallengeTemplateView(view: ChallengeTemplateView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
