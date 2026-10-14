import * as text from "../../../../kit/text.js";
import { FlightBudget } from "./flight-budget.js";

/** How screens and exports show a flight budget. */
export class FlightBudgetView {
  code: string;
  name: string;
  unitText: string;
  category: string;
  journeyId: string;
  pinned: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unitText: string,
    category: string,
    journeyId: string,
    pinned: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unitText = unitText;
    this.category = category;
    this.journeyId = journeyId;
    this.pinned = pinned;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toFlightBudgetView(item: FlightBudget): FlightBudgetView {
  return new FlightBudgetView(
    item.code,
    item.name,
    text.truncate(item.unit, 40),
    item.category,
    item.journeyId,
    `${item.pinned}`,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightBudgetViews(items: FlightBudget[]): FlightBudgetView[] {
  const views: FlightBudgetView[] = [];
  for (const item of items) {
    views.push(toFlightBudgetView(item));
  }
  return views;
}

export function sumFlightBudgetView(view: FlightBudgetView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
