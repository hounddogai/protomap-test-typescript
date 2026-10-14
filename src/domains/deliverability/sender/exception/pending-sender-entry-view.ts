import * as text from "../../../../kit/text.js";
import { PendingSenderEntry } from "./pending-sender-entry.js";

/** How screens and exports show a pending sender entry. */
export class PendingSenderEntryView {
  codeText: string;
  label: string;
  retries: string;
  segmentText: string;
  createdAt: string;
  bidText: string;
  titleText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    retries: string,
    segmentText: string,
    createdAt: string,
    bidText: string,
    titleText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.retries = retries;
    this.segmentText = segmentText;
    this.createdAt = createdAt;
    this.bidText = bidText;
    this.titleText = titleText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSenderEntryView(item: PendingSenderEntry): PendingSenderEntryView {
  return new PendingSenderEntryView(
    item.code,
    item.label,
    String(item.retries),
    text.truncate(item.segment, 120),
    String(item.createdAt),
    item.bid.toFixed(2),
    text.truncate(item.title, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSenderEntryViews(items: PendingSenderEntry[]): PendingSenderEntryView[] {
  const views: PendingSenderEntryView[] = [];
  for (const item of items) {
    views.push(toPendingSenderEntryView(item));
  }
  return views;
}

export function sumPendingSenderEntryView(view: PendingSenderEntryView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedRetries + parsedCreatedAt + parsedBid;
}
