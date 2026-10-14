import * as text from "../../../../kit/text.js";
import { ModelAllocation } from "./model-allocation.js";

/** How screens and exports show a model allocation. */
export class ModelAllocationView {
  code: string;
  labelText: string;
  ownerId: string;
  categoryText: string;
  reviewer: string;
  visibleText: string;
  capacityText: string;
  localeText: string;
  weightText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ownerId: string,
    categoryText: string,
    reviewer: string,
    visibleText: string,
    capacityText: string,
    localeText: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ownerId = ownerId;
    this.categoryText = categoryText;
    this.reviewer = reviewer;
    this.visibleText = visibleText;
    this.capacityText = capacityText;
    this.localeText = localeText;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toModelAllocationView(item: ModelAllocation): ModelAllocationView {
  return new ModelAllocationView(
    text.truncate(item.code, 120),
    item.label,
    text.truncate(item.ownerId, 80),
    text.truncate(item.category, 120),
    text.truncate(item.reviewer, 64),
    `${item.visible}`,
    String(item.capacity),
    item.locale,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelAllocationViews(items: ModelAllocation[]): ModelAllocationView[] {
  const views: ModelAllocationView[] = [];
  for (const item of items) {
    views.push(toModelAllocationView(item));
  }
  return views;
}

export function sumModelAllocationView(view: ModelAllocationView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedCapacity + parsedWeight;
}
