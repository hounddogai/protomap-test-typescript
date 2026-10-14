import { DeflectionCycle } from "./deflection-cycle.js";

/** How screens and exports show a deflection cycle. */
export class DeflectionCycleView {
  code: string;
  labelText: string;
  channelText: string;
  localeText: string;
  clicks: string;
  archived: string;
  batchSize: string;
  retriesText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channelText: string,
    localeText: string,
    clicks: string,
    archived: string,
    batchSize: string,
    retriesText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channelText = channelText;
    this.localeText = localeText;
    this.clicks = clicks;
    this.archived = archived;
    this.batchSize = batchSize;
    this.retriesText = retriesText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionCycleView(item: DeflectionCycle): DeflectionCycleView {
  return new DeflectionCycleView(
    item.code,
    item.label,
    item.channel,
    item.locale,
    String(item.clicks),
    `${item.archived}`,
    String(item.batchSize),
    String(item.retries),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionCycleViews(items: DeflectionCycle[]): DeflectionCycleView[] {
  const views: DeflectionCycleView[] = [];
  for (const item of items) {
    views.push(toDeflectionCycleView(item));
  }
  return views;
}

export function sumDeflectionCycleView(view: DeflectionCycleView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedClicks + parsedBatchSize + parsedRetries;
}
