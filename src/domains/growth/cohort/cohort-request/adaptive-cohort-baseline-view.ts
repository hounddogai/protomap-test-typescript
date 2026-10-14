import * as text from "../../../../kit/text.js";
import { AdaptiveCohortBaseline } from "./adaptive-cohort-baseline.js";

/** How screens and exports show a adaptive cohort baseline. */
export class AdaptiveCohortBaselineView {
  codeText: string;
  name: string;
  floorValueText: string;
  quantity: string;
  updatedAt: string;
  campaignRef: string;
  weight: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    floorValueText: string,
    quantity: string,
    updatedAt: string,
    campaignRef: string,
    weight: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.floorValueText = floorValueText;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.weight = weight;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCohortBaselineView(item: AdaptiveCohortBaseline): AdaptiveCohortBaselineView {
  return new AdaptiveCohortBaselineView(
    text.truncate(item.code, 40),
    item.name,
    item.floorValue.toFixed(2),
    String(item.quantity),
    String(item.updatedAt),
    text.truncate(item.campaignRef, 120),
    item.weight.toFixed(2),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCohortBaselineViews(items: AdaptiveCohortBaseline[]): AdaptiveCohortBaselineView[] {
  const views: AdaptiveCohortBaselineView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCohortBaselineView(item));
  }
  return views;
}

export function sumAdaptiveCohortBaselineView(view: AdaptiveCohortBaselineView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedFloorValue + parsedQuantity + parsedUpdatedAt;
}
