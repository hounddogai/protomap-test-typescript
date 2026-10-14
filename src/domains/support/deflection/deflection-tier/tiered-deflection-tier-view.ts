import * as text from "../../../../kit/text.js";
import { TieredDeflectionTier } from "./tiered-deflection-tier.js";

/** How screens and exports show a tiered deflection tier. */
export class TieredDeflectionTierView {
  codeText: string;
  label: string;
  windowDaysText: string;
  attempts: string;
  ratioText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    windowDaysText: string,
    attempts: string,
    ratioText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.windowDaysText = windowDaysText;
    this.attempts = attempts;
    this.ratioText = ratioText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDeflectionTierView(item: TieredDeflectionTier): TieredDeflectionTierView {
  return new TieredDeflectionTierView(
    item.code,
    text.truncate(item.label, 80),
    String(item.windowDays),
    String(item.attempts),
    item.ratio.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDeflectionTierViews(items: TieredDeflectionTier[]): TieredDeflectionTierView[] {
  const views: TieredDeflectionTierView[] = [];
  for (const item of items) {
    views.push(toTieredDeflectionTierView(item));
  }
  return views;
}

export function sumTieredDeflectionTierView(view: TieredDeflectionTierView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedWindowDays + parsedAttempts + parsedRatio;
}
