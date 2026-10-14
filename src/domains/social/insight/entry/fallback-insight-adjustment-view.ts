import * as text from "../../../../kit/text.js";
import { FallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

/** How screens and exports show a fallback insight adjustment. */
export class FallbackInsightAdjustmentView {
  code: string;
  nameText: string;
  rateText: string;
  bidText: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    rateText: string,
    bidText: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.rateText = rateText;
    this.bidText = bidText;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackInsightAdjustmentView(item: FallbackInsightAdjustment): FallbackInsightAdjustmentView {
  return new FallbackInsightAdjustmentView(
    text.truncate(item.code, 80),
    item.name,
    item.rate.toFixed(2),
    item.bid.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackInsightAdjustmentViews(items: FallbackInsightAdjustment[]): FallbackInsightAdjustmentView[] {
  const views: FallbackInsightAdjustmentView[] = [];
  for (const item of items) {
    views.push(toFallbackInsightAdjustmentView(item));
  }
  return views;
}

export function sumFallbackInsightAdjustmentView(view: FallbackInsightAdjustmentView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedRate + parsedBid;
}
