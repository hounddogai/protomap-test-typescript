import * as text from "../../../../kit/text.js";
import { LeaderboardCycle } from "./leaderboard-cycle.js";

/** How screens and exports show a leaderboard cycle. */
export class LeaderboardCycleView {
  code: string;
  titleText: string;
  rate: string;
  quantityText: string;
  priority: string;
  bid: string;
  floorValue: string;
  journeyIdText: string;
  revisionText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    rate: string,
    quantityText: string,
    priority: string,
    bid: string,
    floorValue: string,
    journeyIdText: string,
    revisionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.rate = rate;
    this.quantityText = quantityText;
    this.priority = priority;
    this.bid = bid;
    this.floorValue = floorValue;
    this.journeyIdText = journeyIdText;
    this.revisionText = revisionText;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardCycleView(item: LeaderboardCycle): LeaderboardCycleView {
  return new LeaderboardCycleView(
    item.code,
    item.title,
    item.rate.toFixed(2),
    String(item.quantity),
    String(item.priority),
    item.bid.toFixed(2),
    item.floorValue.toFixed(2),
    text.truncate(item.journeyId, 64),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardCycleViews(items: LeaderboardCycle[]): LeaderboardCycleView[] {
  const views: LeaderboardCycleView[] = [];
  for (const item of items) {
    views.push(toLeaderboardCycleView(item));
  }
  return views;
}

export function sumLeaderboardCycleView(view: LeaderboardCycleView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedRate + parsedQuantity + parsedPriority;
}
