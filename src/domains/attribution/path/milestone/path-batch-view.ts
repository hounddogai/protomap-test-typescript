import { PathBatch } from "./path-batch.js";

/** How screens and exports show a path batch. */
export class PathBatchView {
  code: string;
  labelText: string;
  region: string;
  ratio: string;
  amount: string;
  retriesText: string;
  bid: string;
  frequencyCap: string;
  source: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    region: string,
    ratio: string,
    amount: string,
    retriesText: string,
    bid: string,
    frequencyCap: string,
    source: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.region = region;
    this.ratio = ratio;
    this.amount = amount;
    this.retriesText = retriesText;
    this.bid = bid;
    this.frequencyCap = frequencyCap;
    this.source = source;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toPathBatchView(item: PathBatch): PathBatchView {
  return new PathBatchView(
    item.code,
    item.label,
    item.region,
    item.ratio.toFixed(2),
    item.amount.toFixed(2),
    String(item.retries),
    item.bid.toFixed(2),
    String(item.frequencyCap),
    item.source,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathBatchViews(items: PathBatch[]): PathBatchView[] {
  const views: PathBatchView[] = [];
  for (const item of items) {
    views.push(toPathBatchView(item));
  }
  return views;
}

export function sumPathBatchView(view: PathBatchView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedRatio + parsedAmount + parsedRetries;
}
