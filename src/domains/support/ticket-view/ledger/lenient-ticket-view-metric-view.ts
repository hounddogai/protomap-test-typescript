import * as text from "../../../../kit/text.js";
import { LenientTicketViewMetric } from "./lenient-ticket-view-metric.js";

/** How screens and exports show a lenient ticket view metric. */
export class LenientTicketViewMetricView {
  codeText: string;
  title: string;
  amountText: string;
  region: string;
  cost: string;
  weightText: string;
  minimum: string;
  campaignRef: string;
  clicksText: string;
  contactEmailText: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    amountText: string,
    region: string,
    cost: string,
    weightText: string,
    minimum: string,
    campaignRef: string,
    clicksText: string,
    contactEmailText: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.amountText = amountText;
    this.region = region;
    this.cost = cost;
    this.weightText = weightText;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.clicksText = clicksText;
    this.contactEmailText = contactEmailText;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientTicketViewMetricView(item: LenientTicketViewMetric): LenientTicketViewMetricView {
  return new LenientTicketViewMetricView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    text.truncate(item.region, 40),
    item.cost.toFixed(2),
    item.weight.toFixed(2),
    item.minimum.toFixed(2),
    text.truncate(item.campaignRef, 80),
    String(item.clicks),
    item.contactEmail,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientTicketViewMetricViews(items: LenientTicketViewMetric[]): LenientTicketViewMetricView[] {
  const views: LenientTicketViewMetricView[] = [];
  for (const item of items) {
    views.push(toLenientTicketViewMetricView(item));
  }
  return views;
}

export function sumLenientTicketViewMetricView(view: LenientTicketViewMetricView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedAmount + parsedCost + parsedWeight;
}
