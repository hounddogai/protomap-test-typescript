import * as text from "../../../../kit/text.js";
import { FrequencyCycle } from "./frequency-cycle.js";

/** How screens and exports show a frequency cycle. */
export class FrequencyCycleView {
  code: string;
  label: string;
  endsAtText: string;
  sequence: string;
  amount: string;
  maximum: string;
  limit: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    endsAtText: string,
    sequence: string,
    amount: string,
    maximum: string,
    limit: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.endsAtText = endsAtText;
    this.sequence = sequence;
    this.amount = amount;
    this.maximum = maximum;
    this.limit = limit;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyCycleView(item: FrequencyCycle): FrequencyCycleView {
  return new FrequencyCycleView(
    item.code,
    text.truncate(item.label, 120),
    String(item.endsAt),
    String(item.sequence),
    item.amount.toFixed(2),
    item.maximum.toFixed(2),
    String(item.limit),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyCycleViews(items: FrequencyCycle[]): FrequencyCycleView[] {
  const views: FrequencyCycleView[] = [];
  for (const item of items) {
    views.push(toFrequencyCycleView(item));
  }
  return views;
}

export function sumFrequencyCycleView(view: FrequencyCycleView): number {
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedEndsAt + parsedSequence + parsedAmount;
}
