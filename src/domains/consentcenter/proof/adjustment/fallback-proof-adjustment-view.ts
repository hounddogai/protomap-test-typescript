import * as text from "../../../../kit/text.js";
import { FallbackProofAdjustment } from "./fallback-proof-adjustment.js";

/** How screens and exports show a fallback proof adjustment. */
export class FallbackProofAdjustmentView {
  code: string;
  label: string;
  notes: string;
  startsAtText: string;
  visible: string;
  weight: string;
  rate: string;
  phone: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    notes: string,
    startsAtText: string,
    visible: string,
    weight: string,
    rate: string,
    phone: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.startsAtText = startsAtText;
    this.visible = visible;
    this.weight = weight;
    this.rate = rate;
    this.phone = phone;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackProofAdjustmentView(item: FallbackProofAdjustment): FallbackProofAdjustmentView {
  return new FallbackProofAdjustmentView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 64),
    text.truncate(item.notes, 40),
    String(item.startsAt),
    `${item.visible}`,
    item.weight.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.phone, 40),
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackProofAdjustmentViews(items: FallbackProofAdjustment[]): FallbackProofAdjustmentView[] {
  const views: FallbackProofAdjustmentView[] = [];
  for (const item of items) {
    views.push(toFallbackProofAdjustmentView(item));
  }
  return views;
}

export function sumFallbackProofAdjustmentView(view: FallbackProofAdjustmentView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedStartsAt + parsedWeight + parsedRate;
}
