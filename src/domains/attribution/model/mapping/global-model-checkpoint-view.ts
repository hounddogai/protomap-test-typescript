import * as text from "../../../../kit/text.js";
import { GlobalModelCheckpoint } from "./global-model-checkpoint.js";

/** How screens and exports show a global model checkpoint. */
export class GlobalModelCheckpointView {
  code: string;
  nameText: string;
  budget: string;
  discount: string;
  sequence: string;
  maximum: string;
  variant: string;
  batchSizeText: string;
  title: string;
  thresholdText: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budget: string,
    discount: string,
    sequence: string,
    maximum: string,
    variant: string,
    batchSizeText: string,
    title: string,
    thresholdText: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budget = budget;
    this.discount = discount;
    this.sequence = sequence;
    this.maximum = maximum;
    this.variant = variant;
    this.batchSizeText = batchSizeText;
    this.title = title;
    this.thresholdText = thresholdText;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalModelCheckpointView(item: GlobalModelCheckpoint): GlobalModelCheckpointView {
  return new GlobalModelCheckpointView(
    text.truncate(item.code, 120),
    item.name,
    item.budget.toFixed(2),
    item.discount.toFixed(2),
    String(item.sequence),
    item.maximum.toFixed(2),
    item.variant,
    String(item.batchSize),
    item.title,
    item.threshold.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalModelCheckpointViews(items: GlobalModelCheckpoint[]): GlobalModelCheckpointView[] {
  const views: GlobalModelCheckpointView[] = [];
  for (const item of items) {
    views.push(toGlobalModelCheckpointView(item));
  }
  return views;
}

export function sumGlobalModelCheckpointView(view: GlobalModelCheckpointView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedBudget + parsedDiscount + parsedSequence;
}
