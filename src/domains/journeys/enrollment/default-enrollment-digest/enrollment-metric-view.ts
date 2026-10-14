import * as text from "../../../../kit/text.js";
import { EnrollmentMetric } from "./enrollment-metric.js";

/** How screens and exports show a enrollment metric. */
export class EnrollmentMetricView {
  code: string;
  nameText: string;
  scoreText: string;
  maximum: string;
  cohort: string;
  channel: string;
  reviewer: string;
  pinned: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    scoreText: string,
    maximum: string,
    cohort: string,
    channel: string,
    reviewer: string,
    pinned: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.scoreText = scoreText;
    this.maximum = maximum;
    this.cohort = cohort;
    this.channel = channel;
    this.reviewer = reviewer;
    this.pinned = pinned;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentMetricView(item: EnrollmentMetric): EnrollmentMetricView {
  return new EnrollmentMetricView(
    text.truncate(item.code, 80),
    item.name,
    item.score.toFixed(2),
    item.maximum.toFixed(2),
    item.cohort,
    item.channel,
    item.reviewer,
    `${item.pinned}`,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentMetricViews(items: EnrollmentMetric[]): EnrollmentMetricView[] {
  const views: EnrollmentMetricView[] = [];
  for (const item of items) {
    views.push(toEnrollmentMetricView(item));
  }
  return views;
}

export function sumEnrollmentMetricView(view: EnrollmentMetricView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedScore + parsedMaximum + parsedRevision;
}
