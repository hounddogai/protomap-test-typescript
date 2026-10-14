import * as text from "../../../../kit/text.js";
import { QueueCheckpoint } from "./queue-checkpoint.js";

/** How screens and exports show a queue checkpoint. */
export class QueueCheckpointView {
  code: string;
  labelText: string;
  regionText: string;
  journeyIdText: string;
  unit: string;
  locale: string;
  retriesText: string;
  minimumText: string;
  summaryText: string;
  limit: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    regionText: string,
    journeyIdText: string,
    unit: string,
    locale: string,
    retriesText: string,
    minimumText: string,
    summaryText: string,
    limit: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.regionText = regionText;
    this.journeyIdText = journeyIdText;
    this.unit = unit;
    this.locale = locale;
    this.retriesText = retriesText;
    this.minimumText = minimumText;
    this.summaryText = summaryText;
    this.limit = limit;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toQueueCheckpointView(item: QueueCheckpoint): QueueCheckpointView {
  return new QueueCheckpointView(
    item.code,
    item.label,
    text.truncate(item.region, 40),
    item.journeyId,
    item.unit,
    item.locale,
    String(item.retries),
    item.minimum.toFixed(2),
    item.summary,
    String(item.limit),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueCheckpointViews(items: QueueCheckpoint[]): QueueCheckpointView[] {
  const views: QueueCheckpointView[] = [];
  for (const item of items) {
    views.push(toQueueCheckpointView(item));
  }
  return views;
}

export function sumQueueCheckpointView(view: QueueCheckpointView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedRetries + parsedMinimum + parsedLimit;
}
