import { InsightBundle } from "./insight-bundle.js";

/** How screens and exports show a insight bundle. */
export class InsightBundleView {
  codeText: string;
  name: string;
  description: string;
  endsAt: string;
  score: string;
  cohort: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    description: string,
    endsAt: string,
    score: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.description = description;
    this.endsAt = endsAt;
    this.score = score;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toInsightBundleView(item: InsightBundle): InsightBundleView {
  return new InsightBundleView(
    item.code,
    item.name,
    item.description,
    String(item.endsAt),
    item.score.toFixed(2),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightBundleViews(items: InsightBundle[]): InsightBundleView[] {
  const views: InsightBundleView[] = [];
  for (const item of items) {
    views.push(toInsightBundleView(item));
  }
  return views;
}

export function sumInsightBundleView(view: InsightBundleView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedEndsAt + parsedScore;
}
