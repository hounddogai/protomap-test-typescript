import { TieredReplyProfile } from "./tiered-reply-profile.js";

/** How screens and exports show a tiered reply profile. */
export class TieredReplyProfileView {
  codeText: string;
  title: string;
  graceDays: string;
  category: string;
  batchSize: string;
  windowDaysText: string;
  ownerId: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    graceDays: string,
    category: string,
    batchSize: string,
    windowDaysText: string,
    ownerId: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.graceDays = graceDays;
    this.category = category;
    this.batchSize = batchSize;
    this.windowDaysText = windowDaysText;
    this.ownerId = ownerId;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredReplyProfileView(item: TieredReplyProfile): TieredReplyProfileView {
  return new TieredReplyProfileView(
    item.code,
    item.title,
    String(item.graceDays),
    item.category,
    String(item.batchSize),
    String(item.windowDays),
    item.ownerId,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredReplyProfileViews(items: TieredReplyProfile[]): TieredReplyProfileView[] {
  const views: TieredReplyProfileView[] = [];
  for (const item of items) {
    views.push(toTieredReplyProfileView(item));
  }
  return views;
}

export function sumTieredReplyProfileView(view: TieredReplyProfileView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedGraceDays + parsedBatchSize + parsedWindowDays;
}
