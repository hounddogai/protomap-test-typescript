import * as text from "../../../../kit/text.js";
import { SuppressionVariance } from "./suppression-variance.js";

/** How screens and exports show a suppression variance. */
export class SuppressionVarianceView {
  codeText: string;
  title: string;
  margin: string;
  startsAt: string;
  retries: string;
  cohortText: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    margin: string,
    startsAt: string,
    retries: string,
    cohortText: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.margin = margin;
    this.startsAt = startsAt;
    this.retries = retries;
    this.cohortText = cohortText;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionVarianceView(item: SuppressionVariance): SuppressionVarianceView {
  return new SuppressionVarianceView(
    item.code,
    item.title,
    item.margin.toFixed(2),
    String(item.startsAt),
    String(item.retries),
    item.cohort,
    text.truncate(item.source, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionVarianceViews(items: SuppressionVariance[]): SuppressionVarianceView[] {
  const views: SuppressionVarianceView[] = [];
  for (const item of items) {
    views.push(toSuppressionVarianceView(item));
  }
  return views;
}

export function sumSuppressionVarianceView(view: SuppressionVarianceView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedMargin + parsedStartsAt + parsedRetries;
}
