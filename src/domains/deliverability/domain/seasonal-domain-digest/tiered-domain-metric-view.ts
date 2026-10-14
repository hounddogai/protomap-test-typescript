import * as text from "../../../../kit/text.js";
import { TieredDomainMetric } from "./tiered-domain-metric.js";

/** How screens and exports show a tiered domain metric. */
export class TieredDomainMetricView {
  code: string;
  labelText: string;
  costText: string;
  frequencyCap: string;
  expiresAtText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    costText: string,
    frequencyCap: string,
    expiresAtText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.costText = costText;
    this.frequencyCap = frequencyCap;
    this.expiresAtText = expiresAtText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDomainMetricView(item: TieredDomainMetric): TieredDomainMetricView {
  return new TieredDomainMetricView(
    text.truncate(item.code, 64),
    item.label,
    item.cost.toFixed(2),
    String(item.frequencyCap),
    String(item.expiresAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDomainMetricViews(items: TieredDomainMetric[]): TieredDomainMetricView[] {
  const views: TieredDomainMetricView[] = [];
  for (const item of items) {
    views.push(toTieredDomainMetricView(item));
  }
  return views;
}

export function sumTieredDomainMetricView(view: TieredDomainMetricView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedCost + parsedFrequencyCap + parsedExpiresAt;
}
