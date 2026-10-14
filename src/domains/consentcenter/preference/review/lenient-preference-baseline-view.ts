import * as text from "../../../../kit/text.js";
import { LenientPreferenceBaseline } from "./lenient-preference-baseline.js";

/** How screens and exports show a lenient preference baseline. */
export class LenientPreferenceBaselineView {
  codeText: string;
  title: string;
  notes: string;
  descriptionText: string;
  category: string;
  sequence: string;
  utmSource: string;
  countryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    notes: string,
    descriptionText: string,
    category: string,
    sequence: string,
    utmSource: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.notes = notes;
    this.descriptionText = descriptionText;
    this.category = category;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPreferenceBaselineView(item: LenientPreferenceBaseline): LenientPreferenceBaselineView {
  return new LenientPreferenceBaselineView(
    item.code,
    item.title,
    item.notes,
    text.truncate(item.description, 80),
    item.category,
    String(item.sequence),
    text.truncate(item.utmSource, 80),
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPreferenceBaselineViews(items: LenientPreferenceBaseline[]): LenientPreferenceBaselineView[] {
  const views: LenientPreferenceBaselineView[] = [];
  for (const item of items) {
    views.push(toLenientPreferenceBaselineView(item));
  }
  return views;
}

export function sumLenientPreferenceBaselineView(view: LenientPreferenceBaselineView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
