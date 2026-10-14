import * as text from "../../../../kit/text.js";
import { RewardSummary } from "./reward-summary.js";

/** How screens and exports show a reward summary. */
export class RewardSummaryView {
  code: string;
  name: string;
  durationMinutesText: string;
  cohort: string;
  label: string;
  priority: string;
  journeyIdText: string;
  ownerId: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutesText: string,
    cohort: string,
    label: string,
    priority: string,
    journeyIdText: string,
    ownerId: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutesText = durationMinutesText;
    this.cohort = cohort;
    this.label = label;
    this.priority = priority;
    this.journeyIdText = journeyIdText;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toRewardSummaryView(item: RewardSummary): RewardSummaryView {
  return new RewardSummaryView(
    text.truncate(item.code, 80),
    item.name,
    String(item.durationMinutes),
    text.truncate(item.cohort, 120),
    text.truncate(item.label, 120),
    String(item.priority),
    item.journeyId,
    text.truncate(item.ownerId, 80),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardSummaryViews(items: RewardSummary[]): RewardSummaryView[] {
  const views: RewardSummaryView[] = [];
  for (const item of items) {
    views.push(toRewardSummaryView(item));
  }
  return views;
}

export function sumRewardSummaryView(view: RewardSummaryView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedDurationMinutes + parsedPriority + parsedFloorValue;
}
