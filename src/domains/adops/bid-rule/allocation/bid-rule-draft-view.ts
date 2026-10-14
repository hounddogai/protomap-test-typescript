import * as text from "../../../../kit/text.js";
import { BidRuleDraft } from "./bid-rule-draft.js";

/** How screens and exports show a bid rule draft. */
export class BidRuleDraftView {
  codeText: string;
  title: string;
  variantText: string;
  journeyIdText: string;
  region: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    variantText: string,
    journeyIdText: string,
    region: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.variantText = variantText;
    this.journeyIdText = journeyIdText;
    this.region = region;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toBidRuleDraftView(item: BidRuleDraft): BidRuleDraftView {
  return new BidRuleDraftView(
    item.code,
    text.truncate(item.title, 120),
    item.variant,
    item.journeyId,
    item.region,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBidRuleDraftViews(items: BidRuleDraft[]): BidRuleDraftView[] {
  const views: BidRuleDraftView[] = [];
  for (const item of items) {
    views.push(toBidRuleDraftView(item));
  }
  return views;
}

export function sumBidRuleDraftView(view: BidRuleDraftView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
