import * as text from "../../../../kit/text.js";
import { ScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

/** How screens and exports show a scheduled macro agreement. */
export class ScheduledMacroAgreementView {
  code: string;
  labelText: string;
  weight: string;
  currency: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    weight: string,
    currency: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.weight = weight;
    this.currency = currency;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledMacroAgreementView(item: ScheduledMacroAgreement): ScheduledMacroAgreementView {
  return new ScheduledMacroAgreementView(
    text.truncate(item.code, 80),
    item.label,
    item.weight.toFixed(2),
    item.currency,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledMacroAgreementViews(items: ScheduledMacroAgreement[]): ScheduledMacroAgreementView[] {
  const views: ScheduledMacroAgreementView[] = [];
  for (const item of items) {
    views.push(toScheduledMacroAgreementView(item));
  }
  return views;
}

export function sumScheduledMacroAgreementView(view: ScheduledMacroAgreementView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedWeight + parsedScore;
}
