import * as text from "../../../../kit/text.js";
import { FallbackStepOverride } from "./fallback-step-override.js";

/** How screens and exports show a fallback step override. */
export class FallbackStepOverrideView {
  code: string;
  labelText: string;
  amountText: string;
  timezone: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    amountText: string,
    timezone: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.amountText = amountText;
    this.timezone = timezone;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackStepOverrideView(item: FallbackStepOverride): FallbackStepOverrideView {
  return new FallbackStepOverrideView(
    text.truncate(item.code, 64),
    item.label,
    item.amount.toFixed(2),
    item.timezone,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackStepOverrideViews(items: FallbackStepOverride[]): FallbackStepOverrideView[] {
  const views: FallbackStepOverrideView[] = [];
  for (const item of items) {
    views.push(toFallbackStepOverrideView(item));
  }
  return views;
}

export function sumFallbackStepOverrideView(view: FallbackStepOverrideView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedAmount + parsedEndsAt;
}
