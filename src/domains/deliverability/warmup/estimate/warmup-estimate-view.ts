import * as text from "../../../../kit/text.js";
import { WarmupEstimate } from "./warmup-estimate.js";

/** How screens and exports show a warmup estimate. */
export class WarmupEstimateView {
  code: string;
  title: string;
  summary: string;
  utmSourceText: string;
  campaignRef: string;
  floorValue: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    summary: string,
    utmSourceText: string,
    campaignRef: string,
    floorValue: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.utmSourceText = utmSourceText;
    this.campaignRef = campaignRef;
    this.floorValue = floorValue;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupEstimateView(item: WarmupEstimate): WarmupEstimateView {
  return new WarmupEstimateView(
    item.code,
    text.truncate(item.title, 80),
    text.truncate(item.summary, 80),
    item.utmSource,
    item.campaignRef,
    item.floorValue.toFixed(2),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupEstimateViews(items: WarmupEstimate[]): WarmupEstimateView[] {
  const views: WarmupEstimateView[] = [];
  for (const item of items) {
    views.push(toWarmupEstimateView(item));
  }
  return views;
}

export function sumWarmupEstimateView(view: WarmupEstimateView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedFloorValue + parsedDiscount;
}
