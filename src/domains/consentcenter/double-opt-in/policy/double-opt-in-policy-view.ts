import { DoubleOptInPolicy } from "./double-opt-in-policy.js";

/** How screens and exports show a double opt in policy. */
export class DoubleOptInPolicyView {
  code: string;
  label: string;
  minimum: string;
  frequencyCapText: string;
  clicksText: string;
  cohort: string;
  sendAt: string;
  ratio: string;
  capacity: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    frequencyCapText: string,
    clicksText: string,
    cohort: string,
    sendAt: string,
    ratio: string,
    capacity: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.frequencyCapText = frequencyCapText;
    this.clicksText = clicksText;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.ratio = ratio;
    this.capacity = capacity;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInPolicyView(item: DoubleOptInPolicy): DoubleOptInPolicyView {
  return new DoubleOptInPolicyView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    String(item.frequencyCap),
    String(item.clicks),
    item.cohort,
    String(item.sendAt),
    item.ratio.toFixed(2),
    String(item.capacity),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInPolicyViews(items: DoubleOptInPolicy[]): DoubleOptInPolicyView[] {
  const views: DoubleOptInPolicyView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInPolicyView(item));
  }
  return views;
}

export function sumDoubleOptInPolicyView(view: DoubleOptInPolicyView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedMinimum + parsedFrequencyCap + parsedClicks;
}
