import { ActivationRule } from "./activation-rule.js";

/** How screens and exports show a activation rule. */
export class ActivationRuleView {
  code: string;
  titleText: string;
  sequence: string;
  ratioText: string;
  amountText: string;
  summary: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sequence: string,
    ratioText: string,
    amountText: string,
    summary: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sequence = sequence;
    this.ratioText = ratioText;
    this.amountText = amountText;
    this.summary = summary;
    this.statusLabel = statusLabel;
  }
}

export function toActivationRuleView(item: ActivationRule): ActivationRuleView {
  return new ActivationRuleView(
    item.code,
    item.title,
    String(item.sequence),
    item.ratio.toFixed(2),
    item.amount.toFixed(2),
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationRuleViews(items: ActivationRule[]): ActivationRuleView[] {
  const views: ActivationRuleView[] = [];
  for (const item of items) {
    views.push(toActivationRuleView(item));
  }
  return views;
}

export function sumActivationRuleView(view: ActivationRuleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedSequence + parsedRatio + parsedAmount;
}
