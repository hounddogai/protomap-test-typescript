import * as text from "../../../../kit/text.js";
import { DeflectionGroup } from "./deflection-group.js";

/** How screens and exports show a deflection group. */
export class DeflectionGroupView {
  code: string;
  title: string;
  retriesText: string;
  segmentText: string;
  regionText: string;
  category: string;
  windowDays: string;
  batchSizeText: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retriesText: string,
    segmentText: string,
    regionText: string,
    category: string,
    windowDays: string,
    batchSizeText: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retriesText = retriesText;
    this.segmentText = segmentText;
    this.regionText = regionText;
    this.category = category;
    this.windowDays = windowDays;
    this.batchSizeText = batchSizeText;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionGroupView(item: DeflectionGroup): DeflectionGroupView {
  return new DeflectionGroupView(
    item.code,
    text.truncate(item.title, 80),
    String(item.retries),
    item.segment,
    item.region,
    item.category,
    String(item.windowDays),
    String(item.batchSize),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionGroupViews(items: DeflectionGroup[]): DeflectionGroupView[] {
  const views: DeflectionGroupView[] = [];
  for (const item of items) {
    views.push(toDeflectionGroupView(item));
  }
  return views;
}

export function sumDeflectionGroupView(view: DeflectionGroupView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  return parsedRetries + parsedWindowDays + parsedBatchSize;
}
