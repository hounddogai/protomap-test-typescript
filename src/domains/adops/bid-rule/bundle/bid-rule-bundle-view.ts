import * as text from "../../../../kit/text.js";
import { BidRuleBundle } from "./bid-rule-bundle.js";

/** How screens and exports show a bid rule bundle. */
export class BidRuleBundleView {
  codeText: string;
  label: string;
  cohort: string;
  notesText: string;
  score: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    cohort: string,
    notesText: string,
    score: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.cohort = cohort;
    this.notesText = notesText;
    this.score = score;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleBundleView(item: BidRuleBundle): BidRuleBundleView {
  return new BidRuleBundleView(
    item.code,
    item.label,
    text.truncate(item.cohort, 40),
    text.truncate(item.notes, 80),
    item.score.toFixed(2),
    text.truncate(item.checksum, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleBundleViews(items: BidRuleBundle[]): BidRuleBundleView[] {
  const views: BidRuleBundleView[] = [];
  for (const item of items) {
    views.push(toBidRuleBundleView(item));
  }
  return views;
}

export function sumBidRuleBundleView(view: BidRuleBundleView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
