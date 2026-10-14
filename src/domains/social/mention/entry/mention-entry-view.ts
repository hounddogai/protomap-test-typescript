import * as text from "../../../../kit/text.js";
import { MentionEntry } from "./mention-entry.js";

/** How screens and exports show a mention entry. */
export class MentionEntryView {
  code: string;
  titleText: string;
  ceiling: string;
  clicks: string;
  rateText: string;
  windowDays: string;
  variant: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ceiling: string,
    clicks: string,
    rateText: string,
    windowDays: string,
    variant: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ceiling = ceiling;
    this.clicks = clicks;
    this.rateText = rateText;
    this.windowDays = windowDays;
    this.variant = variant;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toMentionEntryView(item: MentionEntry): MentionEntryView {
  return new MentionEntryView(
    text.truncate(item.code, 64),
    item.title,
    item.ceiling.toFixed(2),
    String(item.clicks),
    item.rate.toFixed(2),
    String(item.windowDays),
    text.truncate(item.variant, 40),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionEntryViews(items: MentionEntry[]): MentionEntryView[] {
  const views: MentionEntryView[] = [];
  for (const item of items) {
    views.push(toMentionEntryView(item));
  }
  return views;
}

export function sumMentionEntryView(view: MentionEntryView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedCeiling + parsedClicks + parsedRate;
}
