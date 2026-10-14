import * as text from "../../../../kit/text.js";
import { StepRequest } from "./step-request.js";

/** How screens and exports show a step request. */
export class StepRequestView {
  code: string;
  label: string;
  startsAt: string;
  category: string;
  impressions: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    startsAt: string,
    category: string,
    impressions: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.category = category;
    this.impressions = impressions;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toStepRequestView(item: StepRequest): StepRequestView {
  return new StepRequestView(
    text.truncate(item.code, 40),
    item.label,
    String(item.startsAt),
    text.truncate(item.category, 64),
    String(item.impressions),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepRequestViews(items: StepRequest[]): StepRequestView[] {
  const views: StepRequestView[] = [];
  for (const item of items) {
    views.push(toStepRequestView(item));
  }
  return views;
}

export function sumStepRequestView(view: StepRequestView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedStartsAt + parsedImpressions + parsedScore;
}
