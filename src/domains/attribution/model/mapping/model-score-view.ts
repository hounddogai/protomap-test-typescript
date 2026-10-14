import { ModelScore } from "./model-score.js";

/** How screens and exports show a model score. */
export class ModelScoreView {
  codeText: string;
  label: string;
  createdAt: string;
  graceDays: string;
  sequence: string;
  margin: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    createdAt: string,
    graceDays: string,
    sequence: string,
    margin: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.createdAt = createdAt;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.margin = margin;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toModelScoreView(item: ModelScore): ModelScoreView {
  return new ModelScoreView(
    item.code,
    item.label,
    String(item.createdAt),
    String(item.graceDays),
    String(item.sequence),
    item.margin.toFixed(2),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelScoreViews(items: ModelScore[]): ModelScoreView[] {
  const views: ModelScoreView[] = [];
  for (const item of items) {
    views.push(toModelScoreView(item));
  }
  return views;
}

export function sumModelScoreView(view: ModelScoreView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedCreatedAt + parsedGraceDays + parsedSequence;
}
