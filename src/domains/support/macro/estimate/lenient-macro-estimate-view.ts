import * as text from "../../../../kit/text.js";
import { LenientMacroEstimate } from "./lenient-macro-estimate.js";

/** How screens and exports show a lenient macro estimate. */
export class LenientMacroEstimateView {
  code: string;
  nameText: string;
  capacityText: string;
  campaignRef: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    capacityText: string,
    campaignRef: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.capacityText = capacityText;
    this.campaignRef = campaignRef;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toLenientMacroEstimateView(item: LenientMacroEstimate): LenientMacroEstimateView {
  return new LenientMacroEstimateView(
    item.code,
    text.truncate(item.name, 40),
    String(item.capacity),
    text.truncate(item.campaignRef, 80),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientMacroEstimateViews(items: LenientMacroEstimate[]): LenientMacroEstimateView[] {
  const views: LenientMacroEstimateView[] = [];
  for (const item of items) {
    views.push(toLenientMacroEstimateView(item));
  }
  return views;
}

export function sumLenientMacroEstimateView(view: LenientMacroEstimateView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedCapacity + parsedWeight;
}
