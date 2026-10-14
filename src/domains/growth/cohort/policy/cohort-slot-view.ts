import * as text from "../../../../kit/text.js";
import { CohortSlot } from "./cohort-slot.js";

/** How screens and exports show a cohort slot. */
export class CohortSlotView {
  codeText: string;
  label: string;
  costText: string;
  countryText: string;
  unit: string;
  batchSize: string;
  limitText: string;
  updatedAtText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    costText: string,
    countryText: string,
    unit: string,
    batchSize: string,
    limitText: string,
    updatedAtText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.costText = costText;
    this.countryText = countryText;
    this.unit = unit;
    this.batchSize = batchSize;
    this.limitText = limitText;
    this.updatedAtText = updatedAtText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toCohortSlotView(item: CohortSlot): CohortSlotView {
  return new CohortSlotView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    text.truncate(item.country, 80),
    text.truncate(item.unit, 64),
    String(item.batchSize),
    String(item.limit),
    String(item.updatedAt),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortSlotViews(items: CohortSlot[]): CohortSlotView[] {
  const views: CohortSlotView[] = [];
  for (const item of items) {
    views.push(toCohortSlotView(item));
  }
  return views;
}

export function sumCohortSlotView(view: CohortSlotView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedCost + parsedBatchSize + parsedLimit;
}
