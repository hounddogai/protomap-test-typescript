import * as text from "../../../../kit/text.js";
import { InsightProfile } from "./insight-profile.js";

/** How screens and exports show a insight profile. */
export class InsightProfileView {
  codeText: string;
  titleText: string;
  score: string;
  timezoneText: string;
  segmentText: string;
  weightText: string;
  endsAt: string;
  regionText: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    score: string,
    timezoneText: string,
    segmentText: string,
    weightText: string,
    endsAt: string,
    regionText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.score = score;
    this.timezoneText = timezoneText;
    this.segmentText = segmentText;
    this.weightText = weightText;
    this.endsAt = endsAt;
    this.regionText = regionText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toInsightProfileView(item: InsightProfile): InsightProfileView {
  return new InsightProfileView(
    item.code,
    item.title,
    item.score.toFixed(2),
    item.timezone,
    item.segment,
    item.weight.toFixed(2),
    String(item.endsAt),
    text.truncate(item.region, 40),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightProfileViews(items: InsightProfile[]): InsightProfileView[] {
  const views: InsightProfileView[] = [];
  for (const item of items) {
    views.push(toInsightProfileView(item));
  }
  return views;
}

export function sumInsightProfileView(view: InsightProfileView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedScore + parsedWeight + parsedEndsAt;
}
