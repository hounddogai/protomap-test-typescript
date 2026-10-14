import * as text from "../../../../kit/text.js";
import { LegacyCreativeSegment } from "./legacy-creative-segment.js";

/** How screens and exports show a legacy creative segment. */
export class LegacyCreativeSegmentView {
  codeText: string;
  titleText: string;
  category: string;
  sourceText: string;
  score: string;
  nameText: string;
  threshold: string;
  reviewer: string;
  contactEmail: string;
  budget: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    category: string,
    sourceText: string,
    score: string,
    nameText: string,
    threshold: string,
    reviewer: string,
    contactEmail: string,
    budget: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.category = category;
    this.sourceText = sourceText;
    this.score = score;
    this.nameText = nameText;
    this.threshold = threshold;
    this.reviewer = reviewer;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCreativeSegmentView(item: LegacyCreativeSegment): LegacyCreativeSegmentView {
  return new LegacyCreativeSegmentView(
    item.code,
    item.title,
    item.category,
    item.source,
    item.score.toFixed(2),
    text.truncate(item.name, 120),
    item.threshold.toFixed(2),
    item.reviewer,
    text.truncate(item.contactEmail, 64),
    item.budget.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCreativeSegmentViews(items: LegacyCreativeSegment[]): LegacyCreativeSegmentView[] {
  const views: LegacyCreativeSegmentView[] = [];
  for (const item of items) {
    views.push(toLegacyCreativeSegmentView(item));
  }
  return views;
}

export function sumLegacyCreativeSegmentView(view: LegacyCreativeSegmentView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedScore + parsedThreshold + parsedBudget;
}
