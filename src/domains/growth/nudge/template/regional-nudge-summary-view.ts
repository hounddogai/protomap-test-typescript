import * as text from "../../../../kit/text.js";
import { RegionalNudgeSummary } from "./regional-nudge-summary.js";

/** How screens and exports show a regional nudge summary. */
export class RegionalNudgeSummaryView {
  code: string;
  title: string;
  visible: string;
  priority: string;
  bid: string;
  impressions: string;
  limit: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visible: string,
    priority: string,
    bid: string,
    impressions: string,
    limit: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.priority = priority;
    this.bid = bid;
    this.impressions = impressions;
    this.limit = limit;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalNudgeSummaryView(item: RegionalNudgeSummary): RegionalNudgeSummaryView {
  return new RegionalNudgeSummaryView(
    text.truncate(item.code, 64),
    item.title,
    `${item.visible}`,
    String(item.priority),
    item.bid.toFixed(2),
    String(item.impressions),
    String(item.limit),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalNudgeSummaryViews(items: RegionalNudgeSummary[]): RegionalNudgeSummaryView[] {
  const views: RegionalNudgeSummaryView[] = [];
  for (const item of items) {
    views.push(toRegionalNudgeSummaryView(item));
  }
  return views;
}

export function sumRegionalNudgeSummaryView(view: RegionalNudgeSummaryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedPriority + parsedBid + parsedImpressions;
}
