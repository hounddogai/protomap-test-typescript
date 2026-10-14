import * as text from "../../../../kit/text.js";
import { CappedInsightPlan } from "./capped-insight-plan.js";

/** How screens and exports show a capped insight plan. */
export class CappedInsightPlanView {
  code: string;
  name: string;
  windowDaysText: string;
  notes: string;
  quantity: string;
  floorValue: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    windowDaysText: string,
    notes: string,
    quantity: string,
    floorValue: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.windowDaysText = windowDaysText;
    this.notes = notes;
    this.quantity = quantity;
    this.floorValue = floorValue;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toCappedInsightPlanView(item: CappedInsightPlan): CappedInsightPlanView {
  return new CappedInsightPlanView(
    item.code,
    item.name,
    String(item.windowDays),
    text.truncate(item.notes, 40),
    String(item.quantity),
    item.floorValue.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedInsightPlanViews(items: CappedInsightPlan[]): CappedInsightPlanView[] {
  const views: CappedInsightPlanView[] = [];
  for (const item of items) {
    views.push(toCappedInsightPlanView(item));
  }
  return views;
}

export function sumCappedInsightPlanView(view: CappedInsightPlanView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedWindowDays + parsedQuantity + parsedFloorValue;
}
