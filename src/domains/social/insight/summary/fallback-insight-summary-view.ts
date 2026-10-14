import * as text from "../../../../kit/text.js";
import { FallbackInsightSummary } from "./fallback-insight-summary.js";

/** How screens and exports show a fallback insight summary. */
export class FallbackInsightSummaryView {
  codeText: string;
  labelText: string;
  approved: string;
  frequencyCap: string;
  quantity: string;
  name: string;
  description: string;
  discount: string;
  ratio: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    approved: string,
    frequencyCap: string,
    quantity: string,
    name: string,
    description: string,
    discount: string,
    ratio: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.approved = approved;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.name = name;
    this.description = description;
    this.discount = discount;
    this.ratio = ratio;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackInsightSummaryView(item: FallbackInsightSummary): FallbackInsightSummaryView {
  return new FallbackInsightSummaryView(
    text.truncate(item.code, 64),
    item.label,
    `${item.approved}`,
    String(item.frequencyCap),
    String(item.quantity),
    item.name,
    item.description,
    item.discount.toFixed(2),
    item.ratio.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackInsightSummaryViews(items: FallbackInsightSummary[]): FallbackInsightSummaryView[] {
  const views: FallbackInsightSummaryView[] = [];
  for (const item of items) {
    views.push(toFallbackInsightSummaryView(item));
  }
  return views;
}

export function sumFallbackInsightSummaryView(view: FallbackInsightSummaryView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedFrequencyCap + parsedQuantity + parsedDiscount;
}
