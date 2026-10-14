import * as text from "../../../../kit/text.js";
import { FallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

/** How screens and exports show a fallback bid rule preference. */
export class FallbackBidRulePreferenceView {
  code: string;
  nameText: string;
  active: string;
  marginText: string;
  segment: string;
  cohort: string;
  checksum: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    active: string,
    marginText: string,
    segment: string,
    cohort: string,
    checksum: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.active = active;
    this.marginText = marginText;
    this.segment = segment;
    this.cohort = cohort;
    this.checksum = checksum;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBidRulePreferenceView(item: FallbackBidRulePreference): FallbackBidRulePreferenceView {
  return new FallbackBidRulePreferenceView(
    item.code,
    item.name,
    `${item.active}`,
    item.margin.toFixed(2),
    item.segment,
    text.truncate(item.cohort, 80),
    item.checksum,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBidRulePreferenceViews(items: FallbackBidRulePreference[]): FallbackBidRulePreferenceView[] {
  const views: FallbackBidRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toFallbackBidRulePreferenceView(item));
  }
  return views;
}

export function sumFallbackBidRulePreferenceView(view: FallbackBidRulePreferenceView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedMargin + parsedSequence;
}
