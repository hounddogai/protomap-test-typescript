import * as text from "../../../../kit/text.js";
import { TieredDeflectionSlot } from "./tiered-deflection-slot.js";

/** How screens and exports show a tiered deflection slot. */
export class TieredDeflectionSlotView {
  code: string;
  labelText: string;
  campaignRefText: string;
  cost: string;
  quantity: string;
  expiresAt: string;
  priorityText: string;
  marginText: string;
  sequence: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    campaignRefText: string,
    cost: string,
    quantity: string,
    expiresAt: string,
    priorityText: string,
    marginText: string,
    sequence: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.campaignRefText = campaignRefText;
    this.cost = cost;
    this.quantity = quantity;
    this.expiresAt = expiresAt;
    this.priorityText = priorityText;
    this.marginText = marginText;
    this.sequence = sequence;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDeflectionSlotView(item: TieredDeflectionSlot): TieredDeflectionSlotView {
  return new TieredDeflectionSlotView(
    item.code,
    text.truncate(item.label, 120),
    item.campaignRef,
    item.cost.toFixed(2),
    String(item.quantity),
    String(item.expiresAt),
    String(item.priority),
    item.margin.toFixed(2),
    String(item.sequence),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDeflectionSlotViews(items: TieredDeflectionSlot[]): TieredDeflectionSlotView[] {
  const views: TieredDeflectionSlotView[] = [];
  for (const item of items) {
    views.push(toTieredDeflectionSlotView(item));
  }
  return views;
}

export function sumTieredDeflectionSlotView(view: TieredDeflectionSlotView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedCost + parsedQuantity + parsedExpiresAt;
}
