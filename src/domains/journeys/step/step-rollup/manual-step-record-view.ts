import { ManualStepRecord } from "./manual-step-record.js";

/** How screens and exports show a manual step record. */
export class ManualStepRecordView {
  code: string;
  name: string;
  localeText: string;
  maximum: string;
  sequence: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    localeText: string,
    maximum: string,
    sequence: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.localeText = localeText;
    this.maximum = maximum;
    this.sequence = sequence;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toManualStepRecordView(item: ManualStepRecord): ManualStepRecordView {
  return new ManualStepRecordView(
    item.code,
    item.name,
    item.locale,
    item.maximum.toFixed(2),
    String(item.sequence),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualStepRecordViews(items: ManualStepRecord[]): ManualStepRecordView[] {
  const views: ManualStepRecordView[] = [];
  for (const item of items) {
    views.push(toManualStepRecordView(item));
  }
  return views;
}

export function sumManualStepRecordView(view: ManualStepRecordView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedMaximum + parsedSequence + parsedMinimum;
}
