import * as text from "../../../../kit/text.js";
import { FrequencyBundle } from "./frequency-bundle.js";

/** How screens and exports show a frequency bundle. */
export class FrequencyBundleView {
  codeText: string;
  name: string;
  threshold: string;
  utmSource: string;
  unit: string;
  description: string;
  amount: string;
  versionText: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    threshold: string,
    utmSource: string,
    unit: string,
    description: string,
    amount: string,
    versionText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.unit = unit;
    this.description = description;
    this.amount = amount;
    this.versionText = versionText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyBundleView(item: FrequencyBundle): FrequencyBundleView {
  return new FrequencyBundleView(
    item.code,
    item.name,
    item.threshold.toFixed(2),
    item.utmSource,
    text.truncate(item.unit, 40),
    item.description,
    item.amount.toFixed(2),
    String(item.version),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyBundleViews(items: FrequencyBundle[]): FrequencyBundleView[] {
  const views: FrequencyBundleView[] = [];
  for (const item of items) {
    views.push(toFrequencyBundleView(item));
  }
  return views;
}

export function sumFrequencyBundleView(view: FrequencyBundleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedThreshold + parsedAmount + parsedVersion;
}
