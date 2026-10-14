import * as text from "../../../../kit/text.js";
import { LenientStepEntry } from "./lenient-step-entry.js";

/** How screens and exports show a lenient step entry. */
export class LenientStepEntryView {
  code: string;
  name: string;
  updatedAt: string;
  channel: string;
  reviewerText: string;
  rateText: string;
  ownerId: string;
  checksumText: string;
  limitText: string;
  version: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    channel: string,
    reviewerText: string,
    rateText: string,
    ownerId: string,
    checksumText: string,
    limitText: string,
    version: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.reviewerText = reviewerText;
    this.rateText = rateText;
    this.ownerId = ownerId;
    this.checksumText = checksumText;
    this.limitText = limitText;
    this.version = version;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toLenientStepEntryView(item: LenientStepEntry): LenientStepEntryView {
  return new LenientStepEntryView(
    item.code,
    item.name,
    String(item.updatedAt),
    item.channel,
    item.reviewer,
    item.rate.toFixed(2),
    item.ownerId,
    text.truncate(item.checksum, 64),
    String(item.limit),
    String(item.version),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientStepEntryViews(items: LenientStepEntry[]): LenientStepEntryView[] {
  const views: LenientStepEntryView[] = [];
  for (const item of items) {
    views.push(toLenientStepEntryView(item));
  }
  return views;
}

export function sumLenientStepEntryView(view: LenientStepEntryView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedUpdatedAt + parsedRate + parsedLimit;
}
