import * as text from "../../../../kit/text.js";
import { DefaultPaywallMetric } from "./default-paywall-metric.js";

/** How screens and exports show a default paywall metric. */
export class DefaultPaywallMetricView {
  code: string;
  title: string;
  expiresAt: string;
  revision: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAt: string,
    revision: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.revision = revision;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPaywallMetricView(item: DefaultPaywallMetric): DefaultPaywallMetricView {
  return new DefaultPaywallMetricView(
    text.truncate(item.code, 80),
    item.title,
    String(item.expiresAt),
    String(item.revision),
    text.truncate(item.country, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPaywallMetricViews(items: DefaultPaywallMetric[]): DefaultPaywallMetricView[] {
  const views: DefaultPaywallMetricView[] = [];
  for (const item of items) {
    views.push(toDefaultPaywallMetricView(item));
  }
  return views;
}

export function sumDefaultPaywallMetricView(view: DefaultPaywallMetricView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedExpiresAt + parsedRevision;
}
