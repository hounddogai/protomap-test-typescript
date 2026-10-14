import * as text from "../../../../kit/text.js";
import { PathVariance } from "./path-variance.js";

/** How screens and exports show a path variance. */
export class PathVarianceView {
  codeText: string;
  name: string;
  visible: string;
  attempts: string;
  ratio: string;
  notes: string;
  batchSize: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    visible: string,
    attempts: string,
    ratio: string,
    notes: string,
    batchSize: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.visible = visible;
    this.attempts = attempts;
    this.ratio = ratio;
    this.notes = notes;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toPathVarianceView(item: PathVariance): PathVarianceView {
  return new PathVarianceView(
    item.code,
    item.name,
    `${item.visible}`,
    String(item.attempts),
    item.ratio.toFixed(2),
    text.truncate(item.notes, 80),
    String(item.batchSize),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathVarianceViews(items: PathVariance[]): PathVarianceView[] {
  const views: PathVarianceView[] = [];
  for (const item of items) {
    views.push(toPathVarianceView(item));
  }
  return views;
}

export function sumPathVarianceView(view: PathVarianceView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedAttempts + parsedRatio + parsedBatchSize;
}
