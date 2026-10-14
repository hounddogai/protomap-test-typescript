import * as text from "../../../../kit/text.js";
import { WaitBudget } from "./wait-budget.js";

/** How screens and exports show a wait budget. */
export class WaitBudgetView {
  codeText: string;
  label: string;
  impressionsText: string;
  maximumText: string;
  channel: string;
  category: string;
  floorValue: string;
  pinned: string;
  createdAt: string;
  capacity: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    impressionsText: string,
    maximumText: string,
    channel: string,
    category: string,
    floorValue: string,
    pinned: string,
    createdAt: string,
    capacity: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.impressionsText = impressionsText;
    this.maximumText = maximumText;
    this.channel = channel;
    this.category = category;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toWaitBudgetView(item: WaitBudget): WaitBudgetView {
  return new WaitBudgetView(
    item.code,
    text.truncate(item.label, 40),
    String(item.impressions),
    item.maximum.toFixed(2),
    item.channel,
    item.category,
    item.floorValue.toFixed(2),
    `${item.pinned}`,
    String(item.createdAt),
    String(item.capacity),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitBudgetViews(items: WaitBudget[]): WaitBudgetView[] {
  const views: WaitBudgetView[] = [];
  for (const item of items) {
    views.push(toWaitBudgetView(item));
  }
  return views;
}

export function sumWaitBudgetView(view: WaitBudgetView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedImpressions + parsedMaximum + parsedFloorValue;
}
