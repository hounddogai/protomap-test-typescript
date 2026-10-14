import * as text from "../../../../kit/text.js";
import { BatchedFlightVariance } from "./batched-flight-variance.js";

/** How screens and exports show a batched flight variance. */
export class BatchedFlightVarianceView {
  code: string;
  name: string;
  ratio: string;
  rate: string;
  cohortText: string;
  batchSize: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ratio: string,
    rate: string,
    cohortText: string,
    batchSize: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.rate = rate;
    this.cohortText = cohortText;
    this.batchSize = batchSize;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFlightVarianceView(item: BatchedFlightVariance): BatchedFlightVarianceView {
  return new BatchedFlightVarianceView(
    text.truncate(item.code, 64),
    item.name,
    item.ratio.toFixed(2),
    item.rate.toFixed(2),
    item.cohort,
    String(item.batchSize),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFlightVarianceViews(items: BatchedFlightVariance[]): BatchedFlightVarianceView[] {
  const views: BatchedFlightVarianceView[] = [];
  for (const item of items) {
    views.push(toBatchedFlightVarianceView(item));
  }
  return views;
}

export function sumBatchedFlightVarianceView(view: BatchedFlightVarianceView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedRatio + parsedRate + parsedBatchSize;
}
