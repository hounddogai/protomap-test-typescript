import { ExitRuleException } from "./exit-rule-exception.js";

/** How screens and exports show a exit rule exception. */
export class ExitRuleExceptionView {
  codeText: string;
  name: string;
  weight: string;
  ceilingText: string;
  bid: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    weight: string,
    ceilingText: string,
    bid: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.weight = weight;
    this.ceilingText = ceilingText;
    this.bid = bid;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleExceptionView(item: ExitRuleException): ExitRuleExceptionView {
  return new ExitRuleExceptionView(
    item.code,
    item.name,
    item.weight.toFixed(2),
    item.ceiling.toFixed(2),
    item.bid.toFixed(2),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleExceptionViews(items: ExitRuleException[]): ExitRuleExceptionView[] {
  const views: ExitRuleExceptionView[] = [];
  for (const item of items) {
    views.push(toExitRuleExceptionView(item));
  }
  return views;
}

export function sumExitRuleExceptionView(view: ExitRuleExceptionView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedWeight + parsedCeiling + parsedBid;
}
