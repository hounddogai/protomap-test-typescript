import * as text from "../../../../kit/text.js";
import { LenientPaywallMetric } from "./lenient-paywall-metric.js";

/** How screens and exports show a lenient paywall metric. */
export class LenientPaywallMetricView {
  code: string;
  name: string;
  expiresAt: string;
  segmentText: string;
  checksum: string;
  summary: string;
  costText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    expiresAt: string,
    segmentText: string,
    checksum: string,
    summary: string,
    costText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.segmentText = segmentText;
    this.checksum = checksum;
    this.summary = summary;
    this.costText = costText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPaywallMetricView(item: LenientPaywallMetric): LenientPaywallMetricView {
  return new LenientPaywallMetricView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 80),
    String(item.expiresAt),
    text.truncate(item.segment, 64),
    item.checksum,
    text.truncate(item.summary, 80),
    item.cost.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPaywallMetricViews(items: LenientPaywallMetric[]): LenientPaywallMetricView[] {
  const views: LenientPaywallMetricView[] = [];
  for (const item of items) {
    views.push(toLenientPaywallMetricView(item));
  }
  return views;
}

export function sumLenientPaywallMetricView(view: LenientPaywallMetricView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedExpiresAt + parsedCost;
}
