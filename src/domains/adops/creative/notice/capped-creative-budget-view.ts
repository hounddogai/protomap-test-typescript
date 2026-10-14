import * as text from "../../../../kit/text.js";
import { CappedCreativeBudget } from "./capped-creative-budget.js";

/** How screens and exports show a capped creative budget. */
export class CappedCreativeBudgetView {
  codeText: string;
  titleText: string;
  sequence: string;
  country: string;
  rate: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    sequence: string,
    country: string,
    rate: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.sequence = sequence;
    this.country = country;
    this.rate = rate;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toCappedCreativeBudgetView(item: CappedCreativeBudget): CappedCreativeBudgetView {
  return new CappedCreativeBudgetView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 64),
    String(item.sequence),
    item.country,
    item.rate.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedCreativeBudgetViews(items: CappedCreativeBudget[]): CappedCreativeBudgetView[] {
  const views: CappedCreativeBudgetView[] = [];
  for (const item of items) {
    views.push(toCappedCreativeBudgetView(item));
  }
  return views;
}

export function sumCappedCreativeBudgetView(view: CappedCreativeBudgetView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedSequence + parsedRate + parsedCost;
}
