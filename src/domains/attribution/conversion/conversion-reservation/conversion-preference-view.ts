import * as text from "../../../../kit/text.js";
import { ConversionPreference } from "./conversion-preference.js";

/** How screens and exports show a conversion preference. */
export class ConversionPreferenceView {
  codeText: string;
  label: string;
  priority: string;
  externalRef: string;
  threshold: string;
  startsAt: string;
  currency: string;
  endsAt: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    priority: string,
    externalRef: string,
    threshold: string,
    startsAt: string,
    currency: string,
    endsAt: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.priority = priority;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.currency = currency;
    this.endsAt = endsAt;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toConversionPreferenceView(item: ConversionPreference): ConversionPreferenceView {
  return new ConversionPreferenceView(
    item.code,
    text.truncate(item.label, 80),
    String(item.priority),
    item.externalRef,
    item.threshold.toFixed(2),
    String(item.startsAt),
    text.truncate(item.currency, 64),
    String(item.endsAt),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionPreferenceViews(items: ConversionPreference[]): ConversionPreferenceView[] {
  const views: ConversionPreferenceView[] = [];
  for (const item of items) {
    views.push(toConversionPreferenceView(item));
  }
  return views;
}

export function sumConversionPreferenceView(view: ConversionPreferenceView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedPriority + parsedThreshold + parsedStartsAt;
}
