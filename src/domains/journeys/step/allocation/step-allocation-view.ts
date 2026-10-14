import * as text from "../../../../kit/text.js";
import { StepAllocation } from "./step-allocation.js";

/** How screens and exports show a step allocation. */
export class StepAllocationView {
  code: string;
  labelText: string;
  locale: string;
  summaryText: string;
  archived: string;
  ownerId: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    summaryText: string,
    archived: string,
    ownerId: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.summaryText = summaryText;
    this.archived = archived;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toStepAllocationView(item: StepAllocation): StepAllocationView {
  return new StepAllocationView(
    item.code,
    item.label,
    item.locale,
    item.summary,
    `${item.archived}`,
    text.truncate(item.ownerId, 120),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepAllocationViews(items: StepAllocation[]): StepAllocationView[] {
  const views: StepAllocationView[] = [];
  for (const item of items) {
    views.push(toStepAllocationView(item));
  }
  return views;
}

export function sumStepAllocationView(view: StepAllocationView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
