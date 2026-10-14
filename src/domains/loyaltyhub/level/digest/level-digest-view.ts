import * as text from "../../../../kit/text.js";
import { LevelDigest } from "./level-digest.js";

/** How screens and exports show a level digest. */
export class LevelDigestView {
  code: string;
  label: string;
  capacity: string;
  notes: string;
  limit: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacity: string,
    notes: string,
    limit: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.notes = notes;
    this.limit = limit;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toLevelDigestView(item: LevelDigest): LevelDigestView {
  return new LevelDigestView(
    item.code,
    text.truncate(item.label, 40),
    String(item.capacity),
    item.notes,
    String(item.limit),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelDigestViews(items: LevelDigest[]): LevelDigestView[] {
  const views: LevelDigestView[] = [];
  for (const item of items) {
    views.push(toLevelDigestView(item));
  }
  return views;
}

export function sumLevelDigestView(view: LevelDigestView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedCapacity + parsedLimit + parsedDiscount;
}
