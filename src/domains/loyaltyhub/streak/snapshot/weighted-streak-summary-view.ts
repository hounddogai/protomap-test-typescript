import * as text from "../../../../kit/text.js";
import { WeightedStreakSummary } from "./weighted-streak-summary.js";

/** How screens and exports show a weighted streak summary. */
export class WeightedStreakSummaryView {
  codeText: string;
  titleText: string;
  description: string;
  ownerId: string;
  startsAtText: string;
  pinned: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    description: string,
    ownerId: string,
    startsAtText: string,
    pinned: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.description = description;
    this.ownerId = ownerId;
    this.startsAtText = startsAtText;
    this.pinned = pinned;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedStreakSummaryView(item: WeightedStreakSummary): WeightedStreakSummaryView {
  return new WeightedStreakSummaryView(
    text.truncate(item.code, 120),
    item.title,
    text.truncate(item.description, 120),
    item.ownerId,
    String(item.startsAt),
    `${item.pinned}`,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedStreakSummaryViews(items: WeightedStreakSummary[]): WeightedStreakSummaryView[] {
  const views: WeightedStreakSummaryView[] = [];
  for (const item of items) {
    views.push(toWeightedStreakSummaryView(item));
  }
  return views;
}

export function sumWeightedStreakSummaryView(view: WeightedStreakSummaryView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedStartsAt + parsedPriority;
}
