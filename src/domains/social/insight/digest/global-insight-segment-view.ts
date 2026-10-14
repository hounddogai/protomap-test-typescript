import * as text from "../../../../kit/text.js";
import { GlobalInsightSegment } from "./global-insight-segment.js";

/** How screens and exports show a global insight segment. */
export class GlobalInsightSegmentView {
  code: string;
  label: string;
  currencyText: string;
  region: string;
  source: string;
  active: string;
  expiresAt: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    currencyText: string,
    region: string,
    source: string,
    active: string,
    expiresAt: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.currencyText = currencyText;
    this.region = region;
    this.source = source;
    this.active = active;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalInsightSegmentView(item: GlobalInsightSegment): GlobalInsightSegmentView {
  return new GlobalInsightSegmentView(
    item.code,
    text.truncate(item.label, 64),
    item.currency,
    item.region,
    item.source,
    `${item.active}`,
    String(item.expiresAt),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalInsightSegmentViews(items: GlobalInsightSegment[]): GlobalInsightSegmentView[] {
  const views: GlobalInsightSegmentView[] = [];
  for (const item of items) {
    views.push(toGlobalInsightSegmentView(item));
  }
  return views;
}

export function sumGlobalInsightSegmentView(view: GlobalInsightSegmentView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedExpiresAt + parsedCost;
}
