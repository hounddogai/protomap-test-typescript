import * as text from "../../../../kit/text.js";
import { LegacyDeflectionClaim } from "./legacy-deflection-claim.js";

/** How screens and exports show a legacy deflection claim. */
export class LegacyDeflectionClaimView {
  codeText: string;
  label: string;
  notes: string;
  quantityText: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    notes: string,
    quantityText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.notes = notes;
    this.quantityText = quantityText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyDeflectionClaimView(item: LegacyDeflectionClaim): LegacyDeflectionClaimView {
  return new LegacyDeflectionClaimView(
    text.truncate(item.code, 40),
    item.label,
    item.notes,
    String(item.quantity),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyDeflectionClaimViews(items: LegacyDeflectionClaim[]): LegacyDeflectionClaimView[] {
  const views: LegacyDeflectionClaimView[] = [];
  for (const item of items) {
    views.push(toLegacyDeflectionClaimView(item));
  }
  return views;
}

export function sumLegacyDeflectionClaimView(view: LegacyDeflectionClaimView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedQuantity + parsedWeight;
}
