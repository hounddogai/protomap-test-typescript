import * as text from "../../../../kit/text.js";
import { FunnelDraft } from "./funnel-draft.js";

/** How screens and exports show a funnel draft. */
export class FunnelDraftView {
  code: string;
  name: string;
  retries: string;
  batchSizeText: string;
  threshold: string;
  externalRef: string;
  unit: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retries: string,
    batchSizeText: string,
    threshold: string,
    externalRef: string,
    unit: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.batchSizeText = batchSizeText;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.unit = unit;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelDraftView(item: FunnelDraft): FunnelDraftView {
  return new FunnelDraftView(
    text.truncate(item.code, 80),
    item.name,
    String(item.retries),
    String(item.batchSize),
    item.threshold.toFixed(2),
    item.externalRef,
    text.truncate(item.unit, 120),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelDraftViews(items: FunnelDraft[]): FunnelDraftView[] {
  const views: FunnelDraftView[] = [];
  for (const item of items) {
    views.push(toFunnelDraftView(item));
  }
  return views;
}

export function sumFunnelDraftView(view: FunnelDraftView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedRetries + parsedBatchSize + parsedThreshold;
}
