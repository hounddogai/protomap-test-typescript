import * as text from "../../../../kit/text.js";
import { PrimaryReplyMetric } from "./primary-reply-metric.js";

/** How screens and exports show a primary reply metric. */
export class PrimaryReplyMetricView {
  code: string;
  label: string;
  archivedText: string;
  updatedAt: string;
  locale: string;
  budget: string;
  approvedText: string;
  summary: string;
  categoryText: string;
  conversionRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archivedText: string,
    updatedAt: string,
    locale: string,
    budget: string,
    approvedText: string,
    summary: string,
    categoryText: string,
    conversionRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archivedText = archivedText;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.budget = budget;
    this.approvedText = approvedText;
    this.summary = summary;
    this.categoryText = categoryText;
    this.conversionRateText = conversionRateText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryReplyMetricView(item: PrimaryReplyMetric): PrimaryReplyMetricView {
  return new PrimaryReplyMetricView(
    item.code,
    item.label,
    `${item.archived}`,
    String(item.updatedAt),
    item.locale,
    item.budget.toFixed(2),
    `${item.approved}`,
    item.summary,
    text.truncate(item.category, 80),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryReplyMetricViews(items: PrimaryReplyMetric[]): PrimaryReplyMetricView[] {
  const views: PrimaryReplyMetricView[] = [];
  for (const item of items) {
    views.push(toPrimaryReplyMetricView(item));
  }
  return views;
}

export function sumPrimaryReplyMetricView(view: PrimaryReplyMetricView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  return parsedUpdatedAt + parsedBudget + parsedConversionRate;
}
