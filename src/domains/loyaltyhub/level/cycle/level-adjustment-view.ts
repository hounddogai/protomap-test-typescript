import { LevelAdjustment } from "./level-adjustment.js";

/** How screens and exports show a level adjustment. */
export class LevelAdjustmentView {
  code: string;
  titleText: string;
  batchSize: string;
  channel: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    batchSize: string,
    channel: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.batchSize = batchSize;
    this.channel = channel;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toLevelAdjustmentView(item: LevelAdjustment): LevelAdjustmentView {
  return new LevelAdjustmentView(
    item.code,
    item.title,
    String(item.batchSize),
    item.channel,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelAdjustmentViews(items: LevelAdjustment[]): LevelAdjustmentView[] {
  const views: LevelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toLevelAdjustmentView(item));
  }
  return views;
}

export function sumLevelAdjustmentView(view: LevelAdjustmentView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedBatchSize + parsedAmount;
}
