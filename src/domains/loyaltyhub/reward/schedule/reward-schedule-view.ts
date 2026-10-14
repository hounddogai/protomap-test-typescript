import * as text from "../../../../kit/text.js";
import { RewardSchedule } from "./reward-schedule.js";

/** How screens and exports show a reward schedule. */
export class RewardScheduleView {
  code: string;
  titleText: string;
  priority: string;
  retriesText: string;
  variantText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    priority: string,
    retriesText: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.priority = priority;
    this.retriesText = retriesText;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toRewardScheduleView(item: RewardSchedule): RewardScheduleView {
  return new RewardScheduleView(
    item.code,
    text.truncate(item.title, 40),
    String(item.priority),
    String(item.retries),
    text.truncate(item.variant, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRewardScheduleViews(items: RewardSchedule[]): RewardScheduleView[] {
  const views: RewardScheduleView[] = [];
  for (const item of items) {
    views.push(toRewardScheduleView(item));
  }
  return views;
}

export function sumRewardScheduleView(view: RewardScheduleView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedPriority + parsedRetries;
}
