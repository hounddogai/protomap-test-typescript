import * as text from "../../../../kit/text.js";
import { StrictPathEntry } from "./strict-path-entry.js";

/** How screens and exports show a strict path entry. */
export class StrictPathEntryView {
  code: string;
  title: string;
  thresholdText: string;
  archived: string;
  batchSizeText: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    thresholdText: string,
    archived: string,
    batchSizeText: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.thresholdText = thresholdText;
    this.archived = archived;
    this.batchSizeText = batchSizeText;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPathEntryView(item: StrictPathEntry): StrictPathEntryView {
  return new StrictPathEntryView(
    text.truncate(item.code, 80),
    item.title,
    item.threshold.toFixed(2),
    `${item.archived}`,
    String(item.batchSize),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPathEntryViews(items: StrictPathEntry[]): StrictPathEntryView[] {
  const views: StrictPathEntryView[] = [];
  for (const item of items) {
    views.push(toStrictPathEntryView(item));
  }
  return views;
}

export function sumStrictPathEntryView(view: StrictPathEntryView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedThreshold + parsedBatchSize + parsedUpdatedAt;
}
