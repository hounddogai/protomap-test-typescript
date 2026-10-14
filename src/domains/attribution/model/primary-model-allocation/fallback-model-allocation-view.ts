import * as text from "../../../../kit/text.js";
import { FallbackModelAllocation } from "./fallback-model-allocation.js";

/** How screens and exports show a fallback model allocation. */
export class FallbackModelAllocationView {
  code: string;
  labelText: string;
  description: string;
  region: string;
  externalRef: string;
  cost: string;
  floorValue: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    description: string,
    region: string,
    externalRef: string,
    cost: string,
    floorValue: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.description = description;
    this.region = region;
    this.externalRef = externalRef;
    this.cost = cost;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackModelAllocationView(item: FallbackModelAllocation): FallbackModelAllocationView {
  return new FallbackModelAllocationView(
    item.code,
    item.label,
    text.truncate(item.description, 40),
    text.truncate(item.region, 40),
    item.externalRef,
    item.cost.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackModelAllocationViews(items: FallbackModelAllocation[]): FallbackModelAllocationView[] {
  const views: FallbackModelAllocationView[] = [];
  for (const item of items) {
    views.push(toFallbackModelAllocationView(item));
  }
  return views;
}

export function sumFallbackModelAllocationView(view: FallbackModelAllocationView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedCost + parsedFloorValue + parsedDurationMinutes;
}
