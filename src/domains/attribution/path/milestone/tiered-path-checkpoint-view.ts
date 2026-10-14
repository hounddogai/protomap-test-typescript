import { TieredPathCheckpoint } from "./tiered-path-checkpoint.js";

/** How screens and exports show a tiered path checkpoint. */
export class TieredPathCheckpointView {
  codeText: string;
  labelText: string;
  batchSize: string;
  thresholdText: string;
  segment: string;
  openRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    batchSize: string,
    thresholdText: string,
    segment: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.batchSize = batchSize;
    this.thresholdText = thresholdText;
    this.segment = segment;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPathCheckpointView(item: TieredPathCheckpoint): TieredPathCheckpointView {
  return new TieredPathCheckpointView(
    item.code,
    item.label,
    String(item.batchSize),
    item.threshold.toFixed(2),
    item.segment,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPathCheckpointViews(items: TieredPathCheckpoint[]): TieredPathCheckpointView[] {
  const views: TieredPathCheckpointView[] = [];
  for (const item of items) {
    views.push(toTieredPathCheckpointView(item));
  }
  return views;
}

export function sumTieredPathCheckpointView(view: TieredPathCheckpointView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedBatchSize + parsedThreshold + parsedOpenRate;
}
