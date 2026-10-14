import { DeflectionRequest } from "./deflection-request.js";

/** How screens and exports show a deflection request. */
export class DeflectionRequestView {
  codeText: string;
  label: string;
  budget: string;
  createdAt: string;
  quantityText: string;
  utmSource: string;
  score: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    budget: string,
    createdAt: string,
    quantityText: string,
    utmSource: string,
    score: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.budget = budget;
    this.createdAt = createdAt;
    this.quantityText = quantityText;
    this.utmSource = utmSource;
    this.score = score;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionRequestView(item: DeflectionRequest): DeflectionRequestView {
  return new DeflectionRequestView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    String(item.createdAt),
    String(item.quantity),
    item.utmSource,
    item.score.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionRequestViews(items: DeflectionRequest[]): DeflectionRequestView[] {
  const views: DeflectionRequestView[] = [];
  for (const item of items) {
    views.push(toDeflectionRequestView(item));
  }
  return views;
}

export function sumDeflectionRequestView(view: DeflectionRequestView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedBudget + parsedCreatedAt + parsedQuantity;
}
