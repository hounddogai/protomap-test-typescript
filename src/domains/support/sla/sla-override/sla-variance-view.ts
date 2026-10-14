import * as text from "../../../../kit/text.js";
import { SlaVariance } from "./sla-variance.js";

/** How screens and exports show a sla variance. */
export class SlaVarianceView {
  codeText: string;
  titleText: string;
  contactEmail: string;
  createdAtText: string;
  quantity: string;
  conversionRate: string;
  cost: string;
  bid: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    contactEmail: string,
    createdAtText: string,
    quantity: string,
    conversionRate: string,
    cost: string,
    bid: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.contactEmail = contactEmail;
    this.createdAtText = createdAtText;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toSlaVarianceView(item: SlaVariance): SlaVarianceView {
  return new SlaVarianceView(
    item.code,
    item.title,
    text.truncate(item.contactEmail, 40),
    String(item.createdAt),
    String(item.quantity),
    item.conversionRate.toFixed(2),
    item.cost.toFixed(2),
    item.bid.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaVarianceViews(items: SlaVariance[]): SlaVarianceView[] {
  const views: SlaVarianceView[] = [];
  for (const item of items) {
    views.push(toSlaVarianceView(item));
  }
  return views;
}

export function sumSlaVarianceView(view: SlaVarianceView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedCreatedAt + parsedQuantity + parsedConversionRate;
}
