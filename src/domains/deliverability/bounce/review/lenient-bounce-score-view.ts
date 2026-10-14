import * as text from "../../../../kit/text.js";
import { LenientBounceScore } from "./lenient-bounce-score.js";

/** How screens and exports show a lenient bounce score. */
export class LenientBounceScoreView {
  code: string;
  titleText: string;
  campaignRefText: string;
  archivedText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    campaignRefText: string,
    archivedText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.campaignRefText = campaignRefText;
    this.archivedText = archivedText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toLenientBounceScoreView(item: LenientBounceScore): LenientBounceScoreView {
  return new LenientBounceScoreView(
    item.code,
    text.truncate(item.title, 120),
    item.campaignRef,
    `${item.archived}`,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientBounceScoreViews(items: LenientBounceScore[]): LenientBounceScoreView[] {
  const views: LenientBounceScoreView[] = [];
  for (const item of items) {
    views.push(toLenientBounceScoreView(item));
  }
  return views;
}

export function sumLenientBounceScoreView(view: LenientBounceScoreView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
