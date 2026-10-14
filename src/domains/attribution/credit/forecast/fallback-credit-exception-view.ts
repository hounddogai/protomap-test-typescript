import * as text from "../../../../kit/text.js";
import { FallbackCreditException } from "./fallback-credit-exception.js";

/** How screens and exports show a fallback credit exception. */
export class FallbackCreditExceptionView {
  code: string;
  label: string;
  localeText: string;
  floorValueText: string;
  attempts: string;
  durationMinutes: string;
  clicksText: string;
  audienceIdText: string;
  region: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    floorValueText: string,
    attempts: string,
    durationMinutes: string,
    clicksText: string,
    audienceIdText: string,
    region: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.floorValueText = floorValueText;
    this.attempts = attempts;
    this.durationMinutes = durationMinutes;
    this.clicksText = clicksText;
    this.audienceIdText = audienceIdText;
    this.region = region;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreditExceptionView(item: FallbackCreditException): FallbackCreditExceptionView {
  return new FallbackCreditExceptionView(
    item.code,
    item.label,
    text.truncate(item.locale, 120),
    item.floorValue.toFixed(2),
    String(item.attempts),
    String(item.durationMinutes),
    String(item.clicks),
    item.audienceId,
    item.region,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreditExceptionViews(items: FallbackCreditException[]): FallbackCreditExceptionView[] {
  const views: FallbackCreditExceptionView[] = [];
  for (const item of items) {
    views.push(toFallbackCreditExceptionView(item));
  }
  return views;
}

export function sumFallbackCreditExceptionView(view: FallbackCreditExceptionView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedFloorValue + parsedAttempts + parsedDurationMinutes;
}
