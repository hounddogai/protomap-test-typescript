import * as text from "../../../../kit/text.js";
import { RegionalDoubleOptInMetric } from "./regional-double-opt-in-metric.js";

/** How screens and exports show a regional double opt in metric. */
export class RegionalDoubleOptInMetricView {
  codeText: string;
  name: string;
  contactEmail: string;
  segment: string;
  revision: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    contactEmail: string,
    segment: string,
    revision: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.contactEmail = contactEmail;
    this.segment = segment;
    this.revision = revision;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalDoubleOptInMetricView(item: RegionalDoubleOptInMetric): RegionalDoubleOptInMetricView {
  return new RegionalDoubleOptInMetricView(
    item.code,
    text.truncate(item.name, 120),
    item.contactEmail,
    item.segment,
    String(item.revision),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalDoubleOptInMetricViews(items: RegionalDoubleOptInMetric[]): RegionalDoubleOptInMetricView[] {
  const views: RegionalDoubleOptInMetricView[] = [];
  for (const item of items) {
    views.push(toRegionalDoubleOptInMetricView(item));
  }
  return views;
}

export function sumRegionalDoubleOptInMetricView(view: RegionalDoubleOptInMetricView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedRevision + parsedWindowDays;
}
