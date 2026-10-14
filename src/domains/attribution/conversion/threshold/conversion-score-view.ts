import * as text from "../../../../kit/text.js";
import { ConversionScore } from "./conversion-score.js";

/** How screens and exports show a conversion score. */
export class ConversionScoreView {
  codeText: string;
  labelText: string;
  campaignRef: string;
  externalRefText: string;
  approved: string;
  segmentText: string;
  startsAtText: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    campaignRef: string,
    externalRefText: string,
    approved: string,
    segmentText: string,
    startsAtText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.campaignRef = campaignRef;
    this.externalRefText = externalRefText;
    this.approved = approved;
    this.segmentText = segmentText;
    this.startsAtText = startsAtText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toConversionScoreView(item: ConversionScore): ConversionScoreView {
  return new ConversionScoreView(
    item.code,
    text.truncate(item.label, 40),
    text.truncate(item.campaignRef, 80),
    item.externalRef,
    `${item.approved}`,
    item.segment,
    String(item.startsAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionScoreViews(items: ConversionScore[]): ConversionScoreView[] {
  const views: ConversionScoreView[] = [];
  for (const item of items) {
    views.push(toConversionScoreView(item));
  }
  return views;
}

export function sumConversionScoreView(view: ConversionScoreView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedStartsAt + parsedBudget;
}
