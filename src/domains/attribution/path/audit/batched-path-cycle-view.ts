import * as text from "../../../../kit/text.js";
import { BatchedPathCycle } from "./batched-path-cycle.js";

/** How screens and exports show a batched path cycle. */
export class BatchedPathCycleView {
  code: string;
  labelText: string;
  activeText: string;
  region: string;
  costText: string;
  channelText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    activeText: string,
    region: string,
    costText: string,
    channelText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.activeText = activeText;
    this.region = region;
    this.costText = costText;
    this.channelText = channelText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPathCycleView(item: BatchedPathCycle): BatchedPathCycleView {
  return new BatchedPathCycleView(
    item.code,
    item.label,
    `${item.active}`,
    item.region,
    item.cost.toFixed(2),
    text.truncate(item.channel, 64),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPathCycleViews(items: BatchedPathCycle[]): BatchedPathCycleView[] {
  const views: BatchedPathCycleView[] = [];
  for (const item of items) {
    views.push(toBatchedPathCycleView(item));
  }
  return views;
}

export function sumBatchedPathCycleView(view: BatchedPathCycleView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCost + parsedAmount;
}
