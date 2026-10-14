import * as text from "../../../../kit/text.js";
import { CappedWarmupReview } from "./capped-warmup-review.js";

/** How screens and exports show a capped warmup review. */
export class CappedWarmupReviewView {
  codeText: string;
  label: string;
  weight: string;
  audienceIdText: string;
  notes: string;
  name: string;
  unit: string;
  localeText: string;
  channel: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    weight: string,
    audienceIdText: string,
    notes: string,
    name: string,
    unit: string,
    localeText: string,
    channel: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.weight = weight;
    this.audienceIdText = audienceIdText;
    this.notes = notes;
    this.name = name;
    this.unit = unit;
    this.localeText = localeText;
    this.channel = channel;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toCappedWarmupReviewView(item: CappedWarmupReview): CappedWarmupReviewView {
  return new CappedWarmupReviewView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    item.audienceId,
    text.truncate(item.notes, 40),
    text.truncate(item.name, 80),
    item.unit,
    text.truncate(item.locale, 120),
    item.channel,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedWarmupReviewViews(items: CappedWarmupReview[]): CappedWarmupReviewView[] {
  const views: CappedWarmupReviewView[] = [];
  for (const item of items) {
    views.push(toCappedWarmupReviewView(item));
  }
  return views;
}

export function sumCappedWarmupReviewView(view: CappedWarmupReviewView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedWeight;
}
