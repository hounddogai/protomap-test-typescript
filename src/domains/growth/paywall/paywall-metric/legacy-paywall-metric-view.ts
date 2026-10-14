import * as text from "../../../../kit/text.js";
import { LegacyPaywallMetric } from "./legacy-paywall-metric.js";

/** How screens and exports show a legacy paywall metric. */
export class LegacyPaywallMetricView {
  code: string;
  titleText: string;
  audienceId: string;
  updatedAt: string;
  clicks: string;
  openRate: string;
  limit: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    audienceId: string,
    updatedAt: string,
    clicks: string,
    openRate: string,
    limit: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.openRate = openRate;
    this.limit = limit;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPaywallMetricView(item: LegacyPaywallMetric): LegacyPaywallMetricView {
  return new LegacyPaywallMetricView(
    text.truncate(item.code, 80),
    text.truncate(item.title, 80),
    text.truncate(item.audienceId, 80),
    String(item.updatedAt),
    String(item.clicks),
    item.openRate.toFixed(2),
    String(item.limit),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPaywallMetricViews(items: LegacyPaywallMetric[]): LegacyPaywallMetricView[] {
  const views: LegacyPaywallMetricView[] = [];
  for (const item of items) {
    views.push(toLegacyPaywallMetricView(item));
  }
  return views;
}

export function sumLegacyPaywallMetricView(view: LegacyPaywallMetricView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedUpdatedAt + parsedClicks + parsedOpenRate;
}
