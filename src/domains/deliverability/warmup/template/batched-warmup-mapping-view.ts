import * as text from "../../../../kit/text.js";
import { BatchedWarmupMapping } from "./batched-warmup-mapping.js";

/** How screens and exports show a batched warmup mapping. */
export class BatchedWarmupMappingView {
  code: string;
  title: string;
  retries: string;
  version: string;
  rate: string;
  priority: string;
  labelText: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retries: string,
    version: string,
    rate: string,
    priority: string,
    labelText: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.version = version;
    this.rate = rate;
    this.priority = priority;
    this.labelText = labelText;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedWarmupMappingView(item: BatchedWarmupMapping): BatchedWarmupMappingView {
  return new BatchedWarmupMappingView(
    text.truncate(item.code, 40),
    item.title,
    String(item.retries),
    String(item.version),
    item.rate.toFixed(2),
    String(item.priority),
    item.label,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedWarmupMappingViews(items: BatchedWarmupMapping[]): BatchedWarmupMappingView[] {
  const views: BatchedWarmupMappingView[] = [];
  for (const item of items) {
    views.push(toBatchedWarmupMappingView(item));
  }
  return views;
}

export function sumBatchedWarmupMappingView(view: BatchedWarmupMappingView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRetries + parsedVersion + parsedRate;
}
