import * as text from "../../../../kit/text.js";
import { ScheduledDoubleOptInAgreement } from "./scheduled-double-opt-in-agreement.js";

/** How screens and exports show a scheduled double opt in agreement. */
export class ScheduledDoubleOptInAgreementView {
  code: string;
  labelText: string;
  frequencyCapText: string;
  weight: string;
  sequence: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    frequencyCapText: string,
    weight: string,
    sequence: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.frequencyCapText = frequencyCapText;
    this.weight = weight;
    this.sequence = sequence;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledDoubleOptInAgreementView(item: ScheduledDoubleOptInAgreement): ScheduledDoubleOptInAgreementView {
  return new ScheduledDoubleOptInAgreementView(
    item.code,
    text.truncate(item.label, 120),
    String(item.frequencyCap),
    item.weight.toFixed(2),
    String(item.sequence),
    text.truncate(item.currency, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledDoubleOptInAgreementViews(items: ScheduledDoubleOptInAgreement[]): ScheduledDoubleOptInAgreementView[] {
  const views: ScheduledDoubleOptInAgreementView[] = [];
  for (const item of items) {
    views.push(toScheduledDoubleOptInAgreementView(item));
  }
  return views;
}

export function sumScheduledDoubleOptInAgreementView(view: ScheduledDoubleOptInAgreementView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedFrequencyCap + parsedWeight + parsedSequence;
}
