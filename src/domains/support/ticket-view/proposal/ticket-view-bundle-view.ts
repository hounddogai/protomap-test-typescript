import * as text from "../../../../kit/text.js";
import { TicketViewBundle } from "./ticket-view-bundle.js";

/** How screens and exports show a ticket view bundle. */
export class TicketViewBundleView {
  code: string;
  name: string;
  unit: string;
  scoreText: string;
  region: string;
  capacityText: string;
  windowDays: string;
  weight: string;
  budget: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    scoreText: string,
    region: string,
    capacityText: string,
    windowDays: string,
    weight: string,
    budget: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.scoreText = scoreText;
    this.region = region;
    this.capacityText = capacityText;
    this.windowDays = windowDays;
    this.weight = weight;
    this.budget = budget;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewBundleView(item: TicketViewBundle): TicketViewBundleView {
  return new TicketViewBundleView(
    text.truncate(item.code, 80),
    item.name,
    item.unit,
    item.score.toFixed(2),
    item.region,
    String(item.capacity),
    String(item.windowDays),
    item.weight.toFixed(2),
    item.budget.toFixed(2),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewBundleViews(items: TicketViewBundle[]): TicketViewBundleView[] {
  const views: TicketViewBundleView[] = [];
  for (const item of items) {
    views.push(toTicketViewBundleView(item));
  }
  return views;
}

export function sumTicketViewBundleView(view: TicketViewBundleView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedScore + parsedCapacity + parsedWindowDays;
}
