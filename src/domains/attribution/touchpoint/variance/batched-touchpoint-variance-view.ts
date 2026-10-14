import { BatchedTouchpointVariance } from "./batched-touchpoint-variance.js";

/** How screens and exports show a batched touchpoint variance. */
export class BatchedTouchpointVarianceView {
  code: string;
  title: string;
  ratioText: string;
  ceiling: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ratioText: string,
    ceiling: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ratioText = ratioText;
    this.ceiling = ceiling;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedTouchpointVarianceView(item: BatchedTouchpointVariance): BatchedTouchpointVarianceView {
  return new BatchedTouchpointVarianceView(
    item.code,
    item.title,
    item.ratio.toFixed(2),
    item.ceiling.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedTouchpointVarianceViews(items: BatchedTouchpointVariance[]): BatchedTouchpointVarianceView[] {
  const views: BatchedTouchpointVarianceView[] = [];
  for (const item of items) {
    views.push(toBatchedTouchpointVarianceView(item));
  }
  return views;
}

export function sumBatchedTouchpointVarianceView(view: BatchedTouchpointVarianceView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedRatio + parsedCeiling;
}
