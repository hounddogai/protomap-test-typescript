import * as text from "../../../../kit/text.js";
import { DefaultProofBatch } from "./default-proof-batch.js";

/** How screens and exports show a default proof batch. */
export class DefaultProofBatchView {
  code: string;
  title: string;
  graceDays: string;
  active: string;
  weightText: string;
  frequencyCapText: string;
  timezone: string;
  visibleText: string;
  unit: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    graceDays: string,
    active: string,
    weightText: string,
    frequencyCapText: string,
    timezone: string,
    visibleText: string,
    unit: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.active = active;
    this.weightText = weightText;
    this.frequencyCapText = frequencyCapText;
    this.timezone = timezone;
    this.visibleText = visibleText;
    this.unit = unit;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultProofBatchView(item: DefaultProofBatch): DefaultProofBatchView {
  return new DefaultProofBatchView(
    item.code,
    text.truncate(item.title, 64),
    String(item.graceDays),
    `${item.active}`,
    item.weight.toFixed(2),
    String(item.frequencyCap),
    item.timezone,
    `${item.visible}`,
    item.unit,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultProofBatchViews(items: DefaultProofBatch[]): DefaultProofBatchView[] {
  const views: DefaultProofBatchView[] = [];
  for (const item of items) {
    views.push(toDefaultProofBatchView(item));
  }
  return views;
}

export function sumDefaultProofBatchView(view: DefaultProofBatchView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedGraceDays + parsedWeight + parsedFrequencyCap;
}
