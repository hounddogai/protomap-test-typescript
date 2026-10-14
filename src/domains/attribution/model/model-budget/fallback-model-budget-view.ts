import * as text from "../../../../kit/text.js";
import { FallbackModelBudget } from "./fallback-model-budget.js";

/** How screens and exports show a fallback model budget. */
export class FallbackModelBudgetView {
  code: string;
  label: string;
  externalRef: string;
  utmSource: string;
  sequence: string;
  floorValue: string;
  source: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    utmSource: string,
    sequence: string,
    floorValue: string,
    source: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.utmSource = utmSource;
    this.sequence = sequence;
    this.floorValue = floorValue;
    this.source = source;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackModelBudgetView(item: FallbackModelBudget): FallbackModelBudgetView {
  return new FallbackModelBudgetView(
    text.truncate(item.code, 64),
    item.label,
    item.externalRef,
    text.truncate(item.utmSource, 64),
    String(item.sequence),
    item.floorValue.toFixed(2),
    text.truncate(item.source, 80),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackModelBudgetViews(items: FallbackModelBudget[]): FallbackModelBudgetView[] {
  const views: FallbackModelBudgetView[] = [];
  for (const item of items) {
    views.push(toFallbackModelBudgetView(item));
  }
  return views;
}

export function sumFallbackModelBudgetView(view: FallbackModelBudgetView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedSequence + parsedFloorValue;
}
