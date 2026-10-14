import * as text from "../../../../kit/text.js";
import { QueueVariance } from "./queue-variance.js";

/** How screens and exports show a queue variance. */
export class QueueVarianceView {
  codeText: string;
  label: string;
  cohort: string;
  notes: string;
  title: string;
  ceilingText: string;
  batchSize: string;
  journeyId: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    cohort: string,
    notes: string,
    title: string,
    ceilingText: string,
    batchSize: string,
    journeyId: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.cohort = cohort;
    this.notes = notes;
    this.title = title;
    this.ceilingText = ceilingText;
    this.batchSize = batchSize;
    this.journeyId = journeyId;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toQueueVarianceView(item: QueueVariance): QueueVarianceView {
  return new QueueVarianceView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    item.cohort,
    item.notes,
    text.truncate(item.title, 120),
    item.ceiling.toFixed(2),
    String(item.batchSize),
    item.journeyId,
    text.truncate(item.phone, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueVarianceViews(items: QueueVariance[]): QueueVarianceView[] {
  const views: QueueVarianceView[] = [];
  for (const item of items) {
    views.push(toQueueVarianceView(item));
  }
  return views;
}

export function sumQueueVarianceView(view: QueueVarianceView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedCeiling + parsedBatchSize;
}
