import { NudgeEstimate } from "./nudge-estimate.js";

/** How screens and exports show a nudge estimate. */
export class NudgeEstimateView {
  code: string;
  label: string;
  sourceText: string;
  segment: string;
  title: string;
  journeyId: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sourceText: string,
    segment: string,
    title: string,
    journeyId: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sourceText = sourceText;
    this.segment = segment;
    this.title = title;
    this.journeyId = journeyId;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeEstimateView(item: NudgeEstimate): NudgeEstimateView {
  return new NudgeEstimateView(
    item.code,
    item.label,
    item.source,
    item.segment,
    item.title,
    item.journeyId,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeEstimateViews(items: NudgeEstimate[]): NudgeEstimateView[] {
  const views: NudgeEstimateView[] = [];
  for (const item of items) {
    views.push(toNudgeEstimateView(item));
  }
  return views;
}

export function sumNudgeEstimateView(view: NudgeEstimateView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
