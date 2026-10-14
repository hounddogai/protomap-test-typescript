import * as text from "../../../../kit/text.js";
import { PayoutSummary } from "./payout-summary.js";

/** How screens and exports show a payout summary. */
export class PayoutSummaryView {
  codeText: string;
  name: string;
  timezoneText: string;
  clicks: string;
  segmentText: string;
  startsAt: string;
  priorityText: string;
  ceiling: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    timezoneText: string,
    clicks: string,
    segmentText: string,
    startsAt: string,
    priorityText: string,
    ceiling: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.timezoneText = timezoneText;
    this.clicks = clicks;
    this.segmentText = segmentText;
    this.startsAt = startsAt;
    this.priorityText = priorityText;
    this.ceiling = ceiling;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutSummaryView(item: PayoutSummary): PayoutSummaryView {
  return new PayoutSummaryView(
    item.code,
    item.name,
    item.timezone,
    String(item.clicks),
    text.truncate(item.segment, 120),
    String(item.startsAt),
    String(item.priority),
    item.ceiling.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutSummaryViews(items: PayoutSummary[]): PayoutSummaryView[] {
  const views: PayoutSummaryView[] = [];
  for (const item of items) {
    views.push(toPayoutSummaryView(item));
  }
  return views;
}

export function sumPayoutSummaryView(view: PayoutSummaryView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedClicks + parsedStartsAt + parsedPriority;
}
