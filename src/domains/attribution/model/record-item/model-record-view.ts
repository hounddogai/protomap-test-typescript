import { ModelRecord } from "./model-record.js";

/** How screens and exports show a model record. */
export class ModelRecordView {
  codeText: string;
  name: string;
  utmSource: string;
  sequenceText: string;
  maximum: string;
  endsAt: string;
  unitText: string;
  threshold: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    utmSource: string,
    sequenceText: string,
    maximum: string,
    endsAt: string,
    unitText: string,
    threshold: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.utmSource = utmSource;
    this.sequenceText = sequenceText;
    this.maximum = maximum;
    this.endsAt = endsAt;
    this.unitText = unitText;
    this.threshold = threshold;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toModelRecordView(item: ModelRecord): ModelRecordView {
  return new ModelRecordView(
    item.code,
    item.name,
    item.utmSource,
    String(item.sequence),
    item.maximum.toFixed(2),
    String(item.endsAt),
    item.unit,
    item.threshold.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelRecordViews(items: ModelRecord[]): ModelRecordView[] {
  const views: ModelRecordView[] = [];
  for (const item of items) {
    views.push(toModelRecordView(item));
  }
  return views;
}

export function sumModelRecordView(view: ModelRecordView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedSequence + parsedMaximum + parsedEndsAt;
}
