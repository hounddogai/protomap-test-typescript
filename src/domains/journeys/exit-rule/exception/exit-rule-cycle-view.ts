import * as text from "../../../../kit/text.js";
import { ExitRuleCycle } from "./exit-rule-cycle.js";

/** How screens and exports show a exit rule cycle. */
export class ExitRuleCycleView {
  code: string;
  title: string;
  score: string;
  weight: string;
  label: string;
  externalRef: string;
  amountText: string;
  checksum: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    score: string,
    weight: string,
    label: string,
    externalRef: string,
    amountText: string,
    checksum: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.weight = weight;
    this.label = label;
    this.externalRef = externalRef;
    this.amountText = amountText;
    this.checksum = checksum;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleCycleView(item: ExitRuleCycle): ExitRuleCycleView {
  return new ExitRuleCycleView(
    item.code,
    item.title,
    item.score.toFixed(2),
    item.weight.toFixed(2),
    text.truncate(item.label, 120),
    item.externalRef,
    item.amount.toFixed(2),
    item.checksum,
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleCycleViews(items: ExitRuleCycle[]): ExitRuleCycleView[] {
  const views: ExitRuleCycleView[] = [];
  for (const item of items) {
    views.push(toExitRuleCycleView(item));
  }
  return views;
}

export function sumExitRuleCycleView(view: ExitRuleCycleView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedScore + parsedWeight + parsedAmount;
}
