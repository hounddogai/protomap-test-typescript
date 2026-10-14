import { CappedRewardBatch } from "./capped-reward-batch.js";

/** How screens and exports show a capped reward batch. */
export class CappedRewardBatchView {
  code: string;
  label: string;
  amount: string;
  priority: string;
  pinnedText: string;
  unitText: string;
  weightText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amount: string,
    priority: string,
    pinnedText: string,
    unitText: string,
    weightText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.priority = priority;
    this.pinnedText = pinnedText;
    this.unitText = unitText;
    this.weightText = weightText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toCappedRewardBatchView(item: CappedRewardBatch): CappedRewardBatchView {
  return new CappedRewardBatchView(
    item.code,
    item.label,
    item.amount.toFixed(2),
    String(item.priority),
    `${item.pinned}`,
    item.unit,
    item.weight.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedRewardBatchViews(items: CappedRewardBatch[]): CappedRewardBatchView[] {
  const views: CappedRewardBatchView[] = [];
  for (const item of items) {
    views.push(toCappedRewardBatchView(item));
  }
  return views;
}

export function sumCappedRewardBatchView(view: CappedRewardBatchView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedAmount + parsedPriority + parsedWeight;
}
