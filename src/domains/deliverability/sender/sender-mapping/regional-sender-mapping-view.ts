import * as text from "../../../../kit/text.js";
import { RegionalSenderMapping } from "./regional-sender-mapping.js";

/** How screens and exports show a regional sender mapping. */
export class RegionalSenderMappingView {
  code: string;
  labelText: string;
  variantText: string;
  weight: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    variantText: string,
    weight: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.variantText = variantText;
    this.weight = weight;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSenderMappingView(item: RegionalSenderMapping): RegionalSenderMappingView {
  return new RegionalSenderMappingView(
    item.code,
    text.truncate(item.label, 80),
    item.variant,
    item.weight.toFixed(2),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSenderMappingViews(items: RegionalSenderMapping[]): RegionalSenderMappingView[] {
  const views: RegionalSenderMappingView[] = [];
  for (const item of items) {
    views.push(toRegionalSenderMappingView(item));
  }
  return views;
}

export function sumRegionalSenderMappingView(view: RegionalSenderMappingView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedWeight + parsedMaximum;
}
