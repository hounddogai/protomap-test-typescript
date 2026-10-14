import * as text from "../../../../kit/text.js";
import { FallbackFrequencyCycle } from "./fallback-frequency-cycle.js";

/** How screens and exports show a fallback frequency cycle. */
export class FallbackFrequencyCycleView {
  code: string;
  labelText: string;
  limitText: string;
  pinned: string;
  endsAt: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    limitText: string,
    pinned: string,
    endsAt: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.limitText = limitText;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackFrequencyCycleView(item: FallbackFrequencyCycle): FallbackFrequencyCycleView {
  return new FallbackFrequencyCycleView(
    text.truncate(item.code, 64),
    item.label,
    String(item.limit),
    `${item.pinned}`,
    String(item.endsAt),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackFrequencyCycleViews(items: FallbackFrequencyCycle[]): FallbackFrequencyCycleView[] {
  const views: FallbackFrequencyCycleView[] = [];
  for (const item of items) {
    views.push(toFallbackFrequencyCycleView(item));
  }
  return views;
}

export function sumFallbackFrequencyCycleView(view: FallbackFrequencyCycleView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedLimit + parsedEndsAt + parsedQuantity;
}
