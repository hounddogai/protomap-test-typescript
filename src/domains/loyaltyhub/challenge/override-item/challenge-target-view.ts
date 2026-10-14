import * as text from "../../../../kit/text.js";
import { ChallengeTarget } from "./challenge-target.js";

/** How screens and exports show a challenge target. */
export class ChallengeTargetView {
  code: string;
  nameText: string;
  batchSize: string;
  cost: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    batchSize: string,
    cost: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.batchSize = batchSize;
    this.cost = cost;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeTargetView(item: ChallengeTarget): ChallengeTargetView {
  return new ChallengeTargetView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 120),
    String(item.batchSize),
    item.cost.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeTargetViews(items: ChallengeTarget[]): ChallengeTargetView[] {
  const views: ChallengeTargetView[] = [];
  for (const item of items) {
    views.push(toChallengeTargetView(item));
  }
  return views;
}

export function sumChallengeTargetView(view: ChallengeTargetView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedBatchSize + parsedCost + parsedDiscount;
}
