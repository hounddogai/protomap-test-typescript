import * as text from "../../../../kit/text.js";
import { CsatCycle } from "./csat-cycle.js";

/** How screens and exports show a csat cycle. */
export class CsatCycleView {
  codeText: string;
  name: string;
  pinned: string;
  revisionText: string;
  currencyText: string;
  label: string;
  variant: string;
  archived: string;
  batchSize: string;
  notesText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    pinned: string,
    revisionText: string,
    currencyText: string,
    label: string,
    variant: string,
    archived: string,
    batchSize: string,
    notesText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.pinned = pinned;
    this.revisionText = revisionText;
    this.currencyText = currencyText;
    this.label = label;
    this.variant = variant;
    this.archived = archived;
    this.batchSize = batchSize;
    this.notesText = notesText;
    this.statusLabel = statusLabel;
  }
}

export function toCsatCycleView(item: CsatCycle): CsatCycleView {
  return new CsatCycleView(
    text.truncate(item.code, 40),
    item.name,
    `${item.pinned}`,
    String(item.revision),
    item.currency,
    item.label,
    item.variant,
    `${item.archived}`,
    String(item.batchSize),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatCycleViews(items: CsatCycle[]): CsatCycleView[] {
  const views: CsatCycleView[] = [];
  for (const item of items) {
    views.push(toCsatCycleView(item));
  }
  return views;
}

export function sumCsatCycleView(view: CsatCycleView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedRevision + parsedBatchSize;
}
