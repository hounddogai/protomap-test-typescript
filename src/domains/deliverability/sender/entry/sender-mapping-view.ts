import * as text from "../../../../kit/text.js";
import { SenderMapping } from "./sender-mapping.js";

/** How screens and exports show a sender mapping. */
export class SenderMappingView {
  code: string;
  title: string;
  durationMinutes: string;
  bid: string;
  limit: string;
  quantity: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutes: string,
    bid: string,
    limit: string,
    quantity: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
    this.limit = limit;
    this.quantity = quantity;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toSenderMappingView(item: SenderMapping): SenderMappingView {
  return new SenderMappingView(
    text.truncate(item.code, 40),
    item.title,
    String(item.durationMinutes),
    item.bid.toFixed(2),
    String(item.limit),
    String(item.quantity),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderMappingViews(items: SenderMapping[]): SenderMappingView[] {
  const views: SenderMappingView[] = [];
  for (const item of items) {
    views.push(toSenderMappingView(item));
  }
  return views;
}

export function sumSenderMappingView(view: SenderMappingView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedDurationMinutes + parsedBid + parsedLimit;
}
