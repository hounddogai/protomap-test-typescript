import * as text from "../../../../kit/text.js";
import { DeflectionSegment } from "./deflection-segment.js";

/** How screens and exports show a deflection segment. */
export class DeflectionSegmentView {
  code: string;
  nameText: string;
  discountText: string;
  expiresAt: string;
  variantText: string;
  approved: string;
  minimum: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    discountText: string,
    expiresAt: string,
    variantText: string,
    approved: string,
    minimum: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.discountText = discountText;
    this.expiresAt = expiresAt;
    this.variantText = variantText;
    this.approved = approved;
    this.minimum = minimum;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionSegmentView(item: DeflectionSegment): DeflectionSegmentView {
  return new DeflectionSegmentView(
    item.code,
    item.name,
    item.discount.toFixed(2),
    String(item.expiresAt),
    item.variant,
    `${item.approved}`,
    item.minimum.toFixed(2),
    text.truncate(item.unit, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionSegmentViews(items: DeflectionSegment[]): DeflectionSegmentView[] {
  const views: DeflectionSegmentView[] = [];
  for (const item of items) {
    views.push(toDeflectionSegmentView(item));
  }
  return views;
}

export function sumDeflectionSegmentView(view: DeflectionSegmentView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedDiscount + parsedExpiresAt + parsedMinimum;
}
