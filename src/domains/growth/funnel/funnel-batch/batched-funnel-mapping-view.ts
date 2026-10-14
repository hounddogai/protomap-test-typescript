import * as text from "../../../../kit/text.js";
import { BatchedFunnelMapping } from "./batched-funnel-mapping.js";

/** How screens and exports show a batched funnel mapping. */
export class BatchedFunnelMappingView {
  codeText: string;
  title: string;
  unitText: string;
  durationMinutes: string;
  maximum: string;
  bidText: string;
  startsAt: string;
  ratio: string;
  country: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    unitText: string,
    durationMinutes: string,
    maximum: string,
    bidText: string,
    startsAt: string,
    ratio: string,
    country: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.unitText = unitText;
    this.durationMinutes = durationMinutes;
    this.maximum = maximum;
    this.bidText = bidText;
    this.startsAt = startsAt;
    this.ratio = ratio;
    this.country = country;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFunnelMappingView(item: BatchedFunnelMapping): BatchedFunnelMappingView {
  return new BatchedFunnelMappingView(
    item.code,
    text.truncate(item.title, 80),
    item.unit,
    String(item.durationMinutes),
    item.maximum.toFixed(2),
    item.bid.toFixed(2),
    String(item.startsAt),
    item.ratio.toFixed(2),
    item.country,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFunnelMappingViews(items: BatchedFunnelMapping[]): BatchedFunnelMappingView[] {
  const views: BatchedFunnelMappingView[] = [];
  for (const item of items) {
    views.push(toBatchedFunnelMappingView(item));
  }
  return views;
}

export function sumBatchedFunnelMappingView(view: BatchedFunnelMappingView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedDurationMinutes + parsedMaximum + parsedBid;
}
