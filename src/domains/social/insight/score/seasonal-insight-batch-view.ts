import * as text from "../../../../kit/text.js";
import { SeasonalInsightBatch } from "./seasonal-insight-batch.js";

/** How screens and exports show a seasonal insight batch. */
export class SeasonalInsightBatchView {
  code: string;
  nameText: string;
  endsAt: string;
  marginText: string;
  title: string;
  priorityText: string;
  pinned: string;
  maximum: string;
  limit: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    endsAt: string,
    marginText: string,
    title: string,
    priorityText: string,
    pinned: string,
    maximum: string,
    limit: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.endsAt = endsAt;
    this.marginText = marginText;
    this.title = title;
    this.priorityText = priorityText;
    this.pinned = pinned;
    this.maximum = maximum;
    this.limit = limit;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalInsightBatchView(item: SeasonalInsightBatch): SeasonalInsightBatchView {
  return new SeasonalInsightBatchView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 120),
    String(item.endsAt),
    item.margin.toFixed(2),
    item.title,
    String(item.priority),
    `${item.pinned}`,
    item.maximum.toFixed(2),
    String(item.limit),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalInsightBatchViews(items: SeasonalInsightBatch[]): SeasonalInsightBatchView[] {
  const views: SeasonalInsightBatchView[] = [];
  for (const item of items) {
    views.push(toSeasonalInsightBatchView(item));
  }
  return views;
}

export function sumSeasonalInsightBatchView(view: SeasonalInsightBatchView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedEndsAt + parsedMargin + parsedPriority;
}
