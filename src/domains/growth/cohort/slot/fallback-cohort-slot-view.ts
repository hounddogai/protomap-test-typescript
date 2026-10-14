import * as text from "../../../../kit/text.js";
import { FallbackCohortSlot } from "./fallback-cohort-slot.js";

/** How screens and exports show a fallback cohort slot. */
export class FallbackCohortSlotView {
  code: string;
  label: string;
  weight: string;
  budget: string;
  archivedText: string;
  timezone: string;
  ratio: string;
  cohort: string;
  quantityText: string;
  unitText: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weight: string,
    budget: string,
    archivedText: string,
    timezone: string,
    ratio: string,
    cohort: string,
    quantityText: string,
    unitText: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.budget = budget;
    this.archivedText = archivedText;
    this.timezone = timezone;
    this.ratio = ratio;
    this.cohort = cohort;
    this.quantityText = quantityText;
    this.unitText = unitText;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCohortSlotView(item: FallbackCohortSlot): FallbackCohortSlotView {
  return new FallbackCohortSlotView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    item.weight.toFixed(2),
    item.budget.toFixed(2),
    `${item.archived}`,
    item.timezone,
    item.ratio.toFixed(2),
    item.cohort,
    String(item.quantity),
    item.unit,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCohortSlotViews(items: FallbackCohortSlot[]): FallbackCohortSlotView[] {
  const views: FallbackCohortSlotView[] = [];
  for (const item of items) {
    views.push(toFallbackCohortSlotView(item));
  }
  return views;
}

export function sumFallbackCohortSlotView(view: FallbackCohortSlotView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedWeight + parsedBudget + parsedRatio;
}
