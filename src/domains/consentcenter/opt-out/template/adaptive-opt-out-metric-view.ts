import * as text from "../../../../kit/text.js";
import { AdaptiveOptOutMetric } from "./adaptive-opt-out-metric.js";

/** How screens and exports show a adaptive opt out metric. */
export class AdaptiveOptOutMetricView {
  code: string;
  name: string;
  contactEmail: string;
  conversionRate: string;
  revision: string;
  archivedText: string;
  bid: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    conversionRate: string,
    revision: string,
    archivedText: string,
    bid: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.revision = revision;
    this.archivedText = archivedText;
    this.bid = bid;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveOptOutMetricView(item: AdaptiveOptOutMetric): AdaptiveOptOutMetricView {
  return new AdaptiveOptOutMetricView(
    item.code,
    item.name,
    text.truncate(item.contactEmail, 40),
    item.conversionRate.toFixed(2),
    String(item.revision),
    `${item.archived}`,
    item.bid.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveOptOutMetricViews(items: AdaptiveOptOutMetric[]): AdaptiveOptOutMetricView[] {
  const views: AdaptiveOptOutMetricView[] = [];
  for (const item of items) {
    views.push(toAdaptiveOptOutMetricView(item));
  }
  return views;
}

export function sumAdaptiveOptOutMetricView(view: AdaptiveOptOutMetricView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedConversionRate + parsedRevision + parsedBid;
}
