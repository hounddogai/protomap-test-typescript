import * as text from "../../../../kit/text.js";
import { WeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

/** How screens and exports show a weighted opt out agreement. */
export class WeightedOptOutAgreementView {
  code: string;
  title: string;
  channel: string;
  label: string;
  score: string;
  statusLabel: string;

  constructor(code: string, title: string, channel: string, label: string, score: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.label = label;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedOptOutAgreementView(item: WeightedOptOutAgreement): WeightedOptOutAgreementView {
  return new WeightedOptOutAgreementView(
    text.truncate(item.code, 120),
    item.title,
    text.truncate(item.channel, 64),
    item.label,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedOptOutAgreementViews(items: WeightedOptOutAgreement[]): WeightedOptOutAgreementView[] {
  const views: WeightedOptOutAgreementView[] = [];
  for (const item of items) {
    views.push(toWeightedOptOutAgreementView(item));
  }
  return views;
}

export function sumWeightedOptOutAgreementView(view: WeightedOptOutAgreementView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
