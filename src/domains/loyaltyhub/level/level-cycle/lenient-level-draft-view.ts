import * as text from "../../../../kit/text.js";
import { LenientLevelDraft } from "./lenient-level-draft.js";

/** How screens and exports show a lenient level draft. */
export class LenientLevelDraftView {
  code: string;
  title: string;
  reviewer: string;
  weightText: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    weightText: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.weightText = weightText;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toLenientLevelDraftView(item: LenientLevelDraft): LenientLevelDraftView {
  return new LenientLevelDraftView(
    item.code,
    text.truncate(item.title, 80),
    item.reviewer,
    item.weight.toFixed(2),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientLevelDraftViews(items: LenientLevelDraft[]): LenientLevelDraftView[] {
  const views: LenientLevelDraftView[] = [];
  for (const item of items) {
    views.push(toLenientLevelDraftView(item));
  }
  return views;
}

export function sumLenientLevelDraftView(view: LenientLevelDraftView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedWeight + parsedCapacity;
}
