import * as text from "../../../../kit/text.js";
import { PreferenceItem } from "./preference-item.js";

/** How screens and exports show a preference item. */
export class PreferenceItemView {
  code: string;
  label: string;
  segmentText: string;
  variantText: string;
  description: string;
  sequence: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    segmentText: string,
    variantText: string,
    description: string,
    sequence: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.segmentText = segmentText;
    this.variantText = variantText;
    this.description = description;
    this.sequence = sequence;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceItemView(item: PreferenceItem): PreferenceItemView {
  return new PreferenceItemView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    item.segment,
    item.variant,
    item.description,
    String(item.sequence),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceItemViews(items: PreferenceItem[]): PreferenceItemView[] {
  const views: PreferenceItemView[] = [];
  for (const item of items) {
    views.push(toPreferenceItemView(item));
  }
  return views;
}

export function sumPreferenceItemView(view: PreferenceItemView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedSequence + parsedWindowDays;
}
