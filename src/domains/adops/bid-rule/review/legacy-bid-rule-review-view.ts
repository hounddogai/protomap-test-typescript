import * as text from "../../../../kit/text.js";
import { LegacyBidRuleReview } from "./legacy-bid-rule-review.js";

/** How screens and exports show a legacy bid rule review. */
export class LegacyBidRuleReviewView {
  code: string;
  label: string;
  ceiling: string;
  frequencyCap: string;
  sequenceText: string;
  locale: string;
  contactEmail: string;
  threshold: string;
  pinnedText: string;
  audienceId: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ceiling: string,
    frequencyCap: string,
    sequenceText: string,
    locale: string,
    contactEmail: string,
    threshold: string,
    pinnedText: string,
    audienceId: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.sequenceText = sequenceText;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.pinnedText = pinnedText;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyBidRuleReviewView(item: LegacyBidRuleReview): LegacyBidRuleReviewView {
  return new LegacyBidRuleReviewView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 120),
    item.ceiling.toFixed(2),
    String(item.frequencyCap),
    String(item.sequence),
    item.locale,
    text.truncate(item.contactEmail, 80),
    item.threshold.toFixed(2),
    `${item.pinned}`,
    item.audienceId,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyBidRuleReviewViews(items: LegacyBidRuleReview[]): LegacyBidRuleReviewView[] {
  const views: LegacyBidRuleReviewView[] = [];
  for (const item of items) {
    views.push(toLegacyBidRuleReviewView(item));
  }
  return views;
}

export function sumLegacyBidRuleReviewView(view: LegacyBidRuleReviewView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedCeiling + parsedFrequencyCap + parsedSequence;
}
