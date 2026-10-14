import { FrequencyEntry } from "./frequency-entry.js";

/** How screens and exports show a frequency entry. */
export class FrequencyEntryView {
  code: string;
  label: string;
  visibleText: string;
  externalRef: string;
  threshold: string;
  activeText: string;
  reviewer: string;
  cohort: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visibleText: string,
    externalRef: string,
    threshold: string,
    activeText: string,
    reviewer: string,
    cohort: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visibleText = visibleText;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.activeText = activeText;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyEntryView(item: FrequencyEntry): FrequencyEntryView {
  return new FrequencyEntryView(
    item.code,
    item.label,
    `${item.visible}`,
    item.externalRef,
    item.threshold.toFixed(2),
    `${item.active}`,
    item.reviewer,
    item.cohort,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyEntryViews(items: FrequencyEntry[]): FrequencyEntryView[] {
  const views: FrequencyEntryView[] = [];
  for (const item of items) {
    views.push(toFrequencyEntryView(item));
  }
  return views;
}

export function sumFrequencyEntryView(view: FrequencyEntryView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedThreshold + parsedCeiling;
}
