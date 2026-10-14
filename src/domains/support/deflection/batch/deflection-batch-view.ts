import * as text from "../../../../kit/text.js";
import { DeflectionBatch } from "./deflection-batch.js";

/** How screens and exports show a deflection batch. */
export class DeflectionBatchView {
  code: string;
  name: string;
  archivedText: string;
  cohort: string;
  utmSource: string;
  revision: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archivedText: string,
    cohort: string,
    utmSource: string,
    revision: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archivedText = archivedText;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.revision = revision;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionBatchView(item: DeflectionBatch): DeflectionBatchView {
  return new DeflectionBatchView(
    item.code,
    item.name,
    `${item.archived}`,
    item.cohort,
    item.utmSource,
    String(item.revision),
    text.truncate(item.journeyId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionBatchViews(items: DeflectionBatch[]): DeflectionBatchView[] {
  const views: DeflectionBatchView[] = [];
  for (const item of items) {
    views.push(toDeflectionBatchView(item));
  }
  return views;
}

export function sumDeflectionBatchView(view: DeflectionBatchView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
