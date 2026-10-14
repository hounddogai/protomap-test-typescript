import * as text from "../../../../kit/text.js";
import { RewardReservation } from "./reward-reservation.js";

/** How screens and exports show a reward reservation. */
export class RewardReservationView {
  code: string;
  nameText: string;
  clicks: string;
  journeyId: string;
  reviewerText: string;
  startsAtText: string;
  budget: string;
  retries: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    clicks: string,
    journeyId: string,
    reviewerText: string,
    startsAtText: string,
    budget: string,
    retries: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.clicks = clicks;
    this.journeyId = journeyId;
    this.reviewerText = reviewerText;
    this.startsAtText = startsAtText;
    this.budget = budget;
    this.retries = retries;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardReservationView(item: RewardReservation): RewardReservationView {
  return new RewardReservationView(
    item.code,
    item.name,
    String(item.clicks),
    text.truncate(item.journeyId, 120),
    text.truncate(item.reviewer, 80),
    String(item.startsAt),
    item.budget.toFixed(2),
    String(item.retries),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardReservationViews(items: RewardReservation[]): RewardReservationView[] {
  const views: RewardReservationView[] = [];
  for (const item of items) {
    views.push(toRewardReservationView(item));
  }
  return views;
}

export function sumRewardReservationView(view: RewardReservationView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedClicks + parsedStartsAt + parsedBudget;
}
