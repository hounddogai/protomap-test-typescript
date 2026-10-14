import * as text from "../../../../kit/text.js";
import { SuppressionMapping } from "./suppression-mapping.js";

/** How screens and exports show a suppression mapping. */
export class SuppressionMappingView {
  codeText: string;
  labelText: string;
  cost: string;
  retriesText: string;
  openRate: string;
  channel: string;
  budget: string;
  conversionRateText: string;
  rate: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    cost: string,
    retriesText: string,
    openRate: string,
    channel: string,
    budget: string,
    conversionRateText: string,
    rate: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.cost = cost;
    this.retriesText = retriesText;
    this.openRate = openRate;
    this.channel = channel;
    this.budget = budget;
    this.conversionRateText = conversionRateText;
    this.rate = rate;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionMappingView(item: SuppressionMapping): SuppressionMappingView {
  return new SuppressionMappingView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    item.cost.toFixed(2),
    String(item.retries),
    item.openRate.toFixed(2),
    item.channel,
    item.budget.toFixed(2),
    item.conversionRate.toFixed(2),
    item.rate.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionMappingViews(items: SuppressionMapping[]): SuppressionMappingView[] {
  const views: SuppressionMappingView[] = [];
  for (const item of items) {
    views.push(toSuppressionMappingView(item));
  }
  return views;
}

export function sumSuppressionMappingView(view: SuppressionMappingView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedCost + parsedRetries + parsedOpenRate;
}
