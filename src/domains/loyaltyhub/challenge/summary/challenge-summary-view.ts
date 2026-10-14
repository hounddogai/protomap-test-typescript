import { ChallengeSummary } from "./challenge-summary.js";

/** How screens and exports show a challenge summary. */
export class ChallengeSummaryView {
  code: string;
  title: string;
  quantity: string;
  weightText: string;
  minimum: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    quantity: string,
    weightText: string,
    minimum: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.weightText = weightText;
    this.minimum = minimum;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeSummaryView(item: ChallengeSummary): ChallengeSummaryView {
  return new ChallengeSummaryView(
    item.code,
    item.title,
    String(item.quantity),
    item.weight.toFixed(2),
    item.minimum.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeSummaryViews(items: ChallengeSummary[]): ChallengeSummaryView[] {
  const views: ChallengeSummaryView[] = [];
  for (const item of items) {
    views.push(toChallengeSummaryView(item));
  }
  return views;
}

export function sumChallengeSummaryView(view: ChallengeSummaryView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedQuantity + parsedWeight + parsedMinimum;
}
