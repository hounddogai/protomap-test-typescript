import * as text from "../../../../kit/text.js";
import { ManualEnrollmentPreference } from "./manual-enrollment-preference.js";

/** How screens and exports show a manual enrollment preference. */
export class ManualEnrollmentPreferenceView {
  code: string;
  title: string;
  locale: string;
  cohort: string;
  quantityText: string;
  sendAt: string;
  windowDays: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    cohort: string,
    quantityText: string,
    sendAt: string,
    windowDays: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.cohort = cohort;
    this.quantityText = quantityText;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toManualEnrollmentPreferenceView(item: ManualEnrollmentPreference): ManualEnrollmentPreferenceView {
  return new ManualEnrollmentPreferenceView(
    text.truncate(item.code, 64),
    item.title,
    text.truncate(item.locale, 80),
    text.truncate(item.cohort, 120),
    String(item.quantity),
    String(item.sendAt),
    String(item.windowDays),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualEnrollmentPreferenceViews(items: ManualEnrollmentPreference[]): ManualEnrollmentPreferenceView[] {
  const views: ManualEnrollmentPreferenceView[] = [];
  for (const item of items) {
    views.push(toManualEnrollmentPreferenceView(item));
  }
  return views;
}

export function sumManualEnrollmentPreferenceView(view: ManualEnrollmentPreferenceView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedQuantity + parsedSendAt + parsedWindowDays;
}
