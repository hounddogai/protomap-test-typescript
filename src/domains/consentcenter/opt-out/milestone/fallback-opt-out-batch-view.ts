import { FallbackOptOutBatch } from "./fallback-opt-out-batch.js";

/** How screens and exports show a fallback opt out batch. */
export class FallbackOptOutBatchView {
  code: string;
  name: string;
  utmSource: string;
  weight: string;
  ratio: string;
  version: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    weight: string,
    ratio: string,
    version: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.weight = weight;
    this.ratio = ratio;
    this.version = version;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackOptOutBatchView(item: FallbackOptOutBatch): FallbackOptOutBatchView {
  return new FallbackOptOutBatchView(
    item.code,
    item.name,
    item.utmSource,
    item.weight.toFixed(2),
    item.ratio.toFixed(2),
    String(item.version),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackOptOutBatchViews(items: FallbackOptOutBatch[]): FallbackOptOutBatchView[] {
  const views: FallbackOptOutBatchView[] = [];
  for (const item of items) {
    views.push(toFallbackOptOutBatchView(item));
  }
  return views;
}

export function sumFallbackOptOutBatchView(view: FallbackOptOutBatchView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedWeight + parsedRatio + parsedVersion;
}
