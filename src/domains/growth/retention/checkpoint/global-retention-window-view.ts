import * as text from "../../../../kit/text.js";
import { GlobalRetentionWindow } from "./global-retention-window.js";

/** How screens and exports show a global retention window. */
export class GlobalRetentionWindowView {
  code: string;
  label: string;
  floorValueText: string;
  checksum: string;
  description: string;
  country: string;
  variant: string;
  attempts: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValueText: string,
    checksum: string,
    description: string,
    country: string,
    variant: string,
    attempts: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValueText = floorValueText;
    this.checksum = checksum;
    this.description = description;
    this.country = country;
    this.variant = variant;
    this.attempts = attempts;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRetentionWindowView(item: GlobalRetentionWindow): GlobalRetentionWindowView {
  return new GlobalRetentionWindowView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    text.truncate(item.checksum, 40),
    item.description,
    text.truncate(item.country, 64),
    item.variant,
    String(item.attempts),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRetentionWindowViews(items: GlobalRetentionWindow[]): GlobalRetentionWindowView[] {
  const views: GlobalRetentionWindowView[] = [];
  for (const item of items) {
    views.push(toGlobalRetentionWindowView(item));
  }
  return views;
}

export function sumGlobalRetentionWindowView(view: GlobalRetentionWindowView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedFloorValue + parsedAttempts + parsedQuantity;
}
