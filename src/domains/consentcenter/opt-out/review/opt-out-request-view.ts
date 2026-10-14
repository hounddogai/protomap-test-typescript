import * as text from "../../../../kit/text.js";
import { OptOutRequest } from "./opt-out-request.js";

/** How screens and exports show a opt out request. */
export class OptOutRequestView {
  code: string;
  title: string;
  score: string;
  quantity: string;
  regionText: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    score: string,
    quantity: string,
    regionText: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.quantity = quantity;
    this.regionText = regionText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutRequestView(item: OptOutRequest): OptOutRequestView {
  return new OptOutRequestView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 80),
    item.score.toFixed(2),
    String(item.quantity),
    item.region,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutRequestViews(items: OptOutRequest[]): OptOutRequestView[] {
  const views: OptOutRequestView[] = [];
  for (const item of items) {
    views.push(toOptOutRequestView(item));
  }
  return views;
}

export function sumOptOutRequestView(view: OptOutRequestView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedScore + parsedQuantity + parsedCost;
}
