import * as text from "../../../../kit/text.js";
import { CappedCreditDraft } from "./capped-credit-draft.js";

/** How screens and exports show a capped credit draft. */
export class CappedCreditDraftView {
  code: string;
  title: string;
  sequenceText: string;
  graceDays: string;
  archivedText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sequenceText: string,
    graceDays: string,
    archivedText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sequenceText = sequenceText;
    this.graceDays = graceDays;
    this.archivedText = archivedText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toCappedCreditDraftView(item: CappedCreditDraft): CappedCreditDraftView {
  return new CappedCreditDraftView(
    item.code,
    text.truncate(item.title, 64),
    String(item.sequence),
    String(item.graceDays),
    `${item.archived}`,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedCreditDraftViews(items: CappedCreditDraft[]): CappedCreditDraftView[] {
  const views: CappedCreditDraftView[] = [];
  for (const item of items) {
    views.push(toCappedCreditDraftView(item));
  }
  return views;
}

export function sumCappedCreditDraftView(view: CappedCreditDraftView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedSequence + parsedGraceDays + parsedCapacity;
}
