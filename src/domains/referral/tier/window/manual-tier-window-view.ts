import * as text from "../../../../kit/text.js";
import { ManualTierWindow } from "./manual-tier-window.js";

/** How screens and exports show a manual tier window. */
export class ManualTierWindowView {
  code: string;
  title: string;
  name: string;
  maximum: string;
  budget: string;
  quantity: string;
  impressions: string;
  source: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    name: string,
    maximum: string,
    budget: string,
    quantity: string,
    impressions: string,
    source: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.maximum = maximum;
    this.budget = budget;
    this.quantity = quantity;
    this.impressions = impressions;
    this.source = source;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toManualTierWindowView(item: ManualTierWindow): ManualTierWindowView {
  return new ManualTierWindowView(
    item.code,
    item.title,
    item.name,
    item.maximum.toFixed(2),
    item.budget.toFixed(2),
    String(item.quantity),
    String(item.impressions),
    text.truncate(item.source, 120),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTierWindowViews(items: ManualTierWindow[]): ManualTierWindowView[] {
  const views: ManualTierWindowView[] = [];
  for (const item of items) {
    views.push(toManualTierWindowView(item));
  }
  return views;
}

export function sumManualTierWindowView(view: ManualTierWindowView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMaximum + parsedBudget + parsedQuantity;
}
