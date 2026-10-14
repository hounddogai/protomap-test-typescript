import * as text from "../../../../kit/text.js";
import { DefaultPlacementMilestone } from "./default-placement-milestone.js";

/** How screens and exports show a default placement milestone. */
export class DefaultPlacementMilestoneView {
  code: string;
  nameText: string;
  openRateText: string;
  journeyId: string;
  approved: string;
  capacity: string;
  score: string;
  graceDaysText: string;
  quantity: string;
  unit: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    openRateText: string,
    journeyId: string,
    approved: string,
    capacity: string,
    score: string,
    graceDaysText: string,
    quantity: string,
    unit: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.openRateText = openRateText;
    this.journeyId = journeyId;
    this.approved = approved;
    this.capacity = capacity;
    this.score = score;
    this.graceDaysText = graceDaysText;
    this.quantity = quantity;
    this.unit = unit;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPlacementMilestoneView(item: DefaultPlacementMilestone): DefaultPlacementMilestoneView {
  return new DefaultPlacementMilestoneView(
    text.truncate(item.code, 64),
    item.name,
    item.openRate.toFixed(2),
    text.truncate(item.journeyId, 80),
    `${item.approved}`,
    String(item.capacity),
    item.score.toFixed(2),
    String(item.graceDays),
    String(item.quantity),
    item.unit,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPlacementMilestoneViews(items: DefaultPlacementMilestone[]): DefaultPlacementMilestoneView[] {
  const views: DefaultPlacementMilestoneView[] = [];
  for (const item of items) {
    views.push(toDefaultPlacementMilestoneView(item));
  }
  return views;
}

export function sumDefaultPlacementMilestoneView(view: DefaultPlacementMilestoneView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedOpenRate + parsedCapacity + parsedScore;
}
