import { SlaBudget } from "./sla-budget.js";

/** How screens and exports show a sla budget. */
export class SlaBudgetView {
  codeText: string;
  nameText: string;
  cost: string;
  expiresAtText: string;
  utmSource: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    cost: string,
    expiresAtText: string,
    utmSource: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.cost = cost;
    this.expiresAtText = expiresAtText;
    this.utmSource = utmSource;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toSlaBudgetView(item: SlaBudget): SlaBudgetView {
  return new SlaBudgetView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    String(item.expiresAt),
    item.utmSource,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaBudgetViews(items: SlaBudget[]): SlaBudgetView[] {
  const views: SlaBudgetView[] = [];
  for (const item of items) {
    views.push(toSlaBudgetView(item));
  }
  return views;
}

export function sumSlaBudgetView(view: SlaBudgetView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCost + parsedExpiresAt + parsedSequence;
}
