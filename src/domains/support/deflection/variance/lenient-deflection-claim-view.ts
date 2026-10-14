import * as text from "../../../../kit/text.js";
import { LenientDeflectionClaim } from "./lenient-deflection-claim.js";

/** How screens and exports show a lenient deflection claim. */
export class LenientDeflectionClaimView {
  codeText: string;
  nameText: string;
  quantityText: string;
  notes: string;
  phone: string;
  capacityText: string;
  sequence: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    quantityText: string,
    notes: string,
    phone: string,
    capacityText: string,
    sequence: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.quantityText = quantityText;
    this.notes = notes;
    this.phone = phone;
    this.capacityText = capacityText;
    this.sequence = sequence;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toLenientDeflectionClaimView(item: LenientDeflectionClaim): LenientDeflectionClaimView {
  return new LenientDeflectionClaimView(
    text.truncate(item.code, 64),
    item.name,
    String(item.quantity),
    item.notes,
    item.phone,
    String(item.capacity),
    String(item.sequence),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientDeflectionClaimViews(items: LenientDeflectionClaim[]): LenientDeflectionClaimView[] {
  const views: LenientDeflectionClaimView[] = [];
  for (const item of items) {
    views.push(toLenientDeflectionClaimView(item));
  }
  return views;
}

export function sumLenientDeflectionClaimView(view: LenientDeflectionClaimView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedQuantity + parsedCapacity + parsedSequence;
}
