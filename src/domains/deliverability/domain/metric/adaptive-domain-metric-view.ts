import * as text from "../../../../kit/text.js";
import { AdaptiveDomainMetric } from "./adaptive-domain-metric.js";

/** How screens and exports show a adaptive domain metric. */
export class AdaptiveDomainMetricView {
  code: string;
  nameText: string;
  budget: string;
  utmSource: string;
  margin: string;
  summary: string;
  phone: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    budget: string,
    utmSource: string,
    margin: string,
    summary: string,
    phone: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.budget = budget;
    this.utmSource = utmSource;
    this.margin = margin;
    this.summary = summary;
    this.phone = phone;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveDomainMetricView(item: AdaptiveDomainMetric): AdaptiveDomainMetricView {
  return new AdaptiveDomainMetricView(
    text.truncate(item.code, 120),
    item.name,
    item.budget.toFixed(2),
    item.utmSource,
    item.margin.toFixed(2),
    item.summary,
    item.phone,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveDomainMetricViews(items: AdaptiveDomainMetric[]): AdaptiveDomainMetricView[] {
  const views: AdaptiveDomainMetricView[] = [];
  for (const item of items) {
    views.push(toAdaptiveDomainMetricView(item));
  }
  return views;
}

export function sumAdaptiveDomainMetricView(view: AdaptiveDomainMetricView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedBudget + parsedMargin;
}
