import * as text from "../../../../kit/text.js";
import { SuppressionSegment } from "./suppression-segment.js";

/** How screens and exports show a suppression segment. */
export class SuppressionSegmentView {
  code: string;
  name: string;
  campaignRef: string;
  amountText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    amountText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.amountText = amountText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionSegmentView(item: SuppressionSegment): SuppressionSegmentView {
  return new SuppressionSegmentView(
    text.truncate(item.code, 80),
    item.name,
    item.campaignRef,
    item.amount.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionSegmentViews(items: SuppressionSegment[]): SuppressionSegmentView[] {
  const views: SuppressionSegmentView[] = [];
  for (const item of items) {
    views.push(toSuppressionSegmentView(item));
  }
  return views;
}

export function sumSuppressionSegmentView(view: SuppressionSegmentView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
