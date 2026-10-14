import * as text from "../../../../kit/text.js";
import { CappedWindowRequest } from "./capped-window-request.js";

/** How screens and exports show a capped window request. */
export class CappedWindowRequestView {
  code: string;
  title: string;
  audienceIdText: string;
  approved: string;
  notes: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceIdText: string,
    approved: string,
    notes: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceIdText = audienceIdText;
    this.approved = approved;
    this.notes = notes;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedWindowRequestView(item: CappedWindowRequest): CappedWindowRequestView {
  return new CappedWindowRequestView(
    text.truncate(item.code, 40),
    item.title,
    item.audienceId,
    `${item.approved}`,
    item.notes,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedWindowRequestViews(items: CappedWindowRequest[]): CappedWindowRequestView[] {
  const views: CappedWindowRequestView[] = [];
  for (const item of items) {
    views.push(toCappedWindowRequestView(item));
  }
  return views;
}

export function sumCappedWindowRequestView(view: CappedWindowRequestView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedSequence;
}
