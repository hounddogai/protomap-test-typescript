import * as text from "../../../../kit/text.js";
import { WeightedLeaderboardReservation } from "./weighted-leaderboard-reservation.js";

/** How screens and exports show a weighted leaderboard reservation. */
export class WeightedLeaderboardReservationView {
  code: string;
  title: string;
  score: string;
  priorityText: string;
  reviewer: string;
  unit: string;
  openRate: string;
  durationMinutesText: string;
  windowDays: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    score: string,
    priorityText: string,
    reviewer: string,
    unit: string,
    openRate: string,
    durationMinutesText: string,
    windowDays: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.priorityText = priorityText;
    this.reviewer = reviewer;
    this.unit = unit;
    this.openRate = openRate;
    this.durationMinutesText = durationMinutesText;
    this.windowDays = windowDays;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedLeaderboardReservationView(item: WeightedLeaderboardReservation): WeightedLeaderboardReservationView {
  return new WeightedLeaderboardReservationView(
    text.truncate(item.code, 64),
    item.title,
    item.score.toFixed(2),
    String(item.priority),
    item.reviewer,
    text.truncate(item.unit, 120),
    item.openRate.toFixed(2),
    String(item.durationMinutes),
    String(item.windowDays),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedLeaderboardReservationViews(items: WeightedLeaderboardReservation[]): WeightedLeaderboardReservationView[] {
  const views: WeightedLeaderboardReservationView[] = [];
  for (const item of items) {
    views.push(toWeightedLeaderboardReservationView(item));
  }
  return views;
}

export function sumWeightedLeaderboardReservationView(view: WeightedLeaderboardReservationView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedScore + parsedPriority + parsedOpenRate;
}
