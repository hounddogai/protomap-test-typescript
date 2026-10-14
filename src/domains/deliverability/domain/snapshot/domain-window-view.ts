import * as text from "../../../../kit/text.js";
import { DomainWindow } from "./domain-window.js";

/** How screens and exports show a domain window. */
export class DomainWindowView {
  codeText: string;
  labelText: string;
  quantity: string;
  segmentText: string;
  budget: string;
  country: string;
  sequence: string;
  clicks: string;
  conversionRate: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    quantity: string,
    segmentText: string,
    budget: string,
    country: string,
    sequence: string,
    clicks: string,
    conversionRate: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.quantity = quantity;
    this.segmentText = segmentText;
    this.budget = budget;
    this.country = country;
    this.sequence = sequence;
    this.clicks = clicks;
    this.conversionRate = conversionRate;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toDomainWindowView(item: DomainWindow): DomainWindowView {
  return new DomainWindowView(
    item.code,
    item.label,
    String(item.quantity),
    text.truncate(item.segment, 80),
    item.budget.toFixed(2),
    item.country,
    String(item.sequence),
    String(item.clicks),
    item.conversionRate.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainWindowViews(items: DomainWindow[]): DomainWindowView[] {
  const views: DomainWindowView[] = [];
  for (const item of items) {
    views.push(toDomainWindowView(item));
  }
  return views;
}

export function sumDomainWindowView(view: DomainWindowView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedQuantity + parsedBudget + parsedSequence;
}
