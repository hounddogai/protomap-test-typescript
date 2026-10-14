import { TouchpointVariance } from "./touchpoint-variance.js";

/** How screens and exports show a touchpoint variance. */
export class TouchpointVarianceView {
  code: string;
  labelText: string;
  margin: string;
  summaryText: string;
  frequencyCapText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    margin: string,
    summaryText: string,
    frequencyCapText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.margin = margin;
    this.summaryText = summaryText;
    this.frequencyCapText = frequencyCapText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointVarianceView(item: TouchpointVariance): TouchpointVarianceView {
  return new TouchpointVarianceView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    item.summary,
    String(item.frequencyCap),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointVarianceViews(items: TouchpointVariance[]): TouchpointVarianceView[] {
  const views: TouchpointVarianceView[] = [];
  for (const item of items) {
    views.push(toTouchpointVarianceView(item));
  }
  return views;
}

export function sumTouchpointVarianceView(view: TouchpointVarianceView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedMargin + parsedFrequencyCap + parsedBatchSize;
}
