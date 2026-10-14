import * as text from "../../../../kit/text.js";
import { LenientWarmupDraft } from "./lenient-warmup-draft.js";

/** How screens and exports show a lenient warmup draft. */
export class LenientWarmupDraftView {
  codeText: string;
  label: string;
  contactEmailText: string;
  utmSource: string;
  weight: string;
  bid: string;
  retries: string;
  region: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    contactEmailText: string,
    utmSource: string,
    weight: string,
    bid: string,
    retries: string,
    region: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.contactEmailText = contactEmailText;
    this.utmSource = utmSource;
    this.weight = weight;
    this.bid = bid;
    this.retries = retries;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toLenientWarmupDraftView(item: LenientWarmupDraft): LenientWarmupDraftView {
  return new LenientWarmupDraftView(
    item.code,
    item.label,
    text.truncate(item.contactEmail, 64),
    item.utmSource,
    item.weight.toFixed(2),
    item.bid.toFixed(2),
    String(item.retries),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientWarmupDraftViews(items: LenientWarmupDraft[]): LenientWarmupDraftView[] {
  const views: LenientWarmupDraftView[] = [];
  for (const item of items) {
    views.push(toLenientWarmupDraftView(item));
  }
  return views;
}

export function sumLenientWarmupDraftView(view: LenientWarmupDraftView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedWeight + parsedBid + parsedRetries;
}
