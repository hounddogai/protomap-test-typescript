import { CsatMetric } from "./csat-metric.js";

/** How screens and exports show a csat metric. */
export class CsatMetricView {
  code: string;
  name: string;
  quantity: string;
  scoreText: string;
  budget: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    scoreText: string,
    budget: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.scoreText = scoreText;
    this.budget = budget;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toCsatMetricView(item: CsatMetric): CsatMetricView {
  return new CsatMetricView(
    item.code,
    item.name,
    String(item.quantity),
    item.score.toFixed(2),
    item.budget.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatMetricViews(items: CsatMetric[]): CsatMetricView[] {
  const views: CsatMetricView[] = [];
  for (const item of items) {
    views.push(toCsatMetricView(item));
  }
  return views;
}

export function sumCsatMetricView(view: CsatMetricView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedQuantity + parsedScore + parsedBudget;
}
