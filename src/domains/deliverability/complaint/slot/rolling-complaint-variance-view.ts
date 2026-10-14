import * as text from "../../../../kit/text.js";
import { RollingComplaintVariance } from "./rolling-complaint-variance.js";

/** How screens and exports show a rolling complaint variance. */
export class RollingComplaintVarianceView {
  code: string;
  name: string;
  externalRef: string;
  retries: string;
  scoreText: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    retries: string,
    scoreText: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.retries = retries;
    this.scoreText = scoreText;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingComplaintVarianceView(item: RollingComplaintVariance): RollingComplaintVarianceView {
  return new RollingComplaintVarianceView(
    item.code,
    item.name,
    text.truncate(item.externalRef, 120),
    String(item.retries),
    item.score.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingComplaintVarianceViews(items: RollingComplaintVariance[]): RollingComplaintVarianceView[] {
  const views: RollingComplaintVarianceView[] = [];
  for (const item of items) {
    views.push(toRollingComplaintVarianceView(item));
  }
  return views;
}

export function sumRollingComplaintVarianceView(view: RollingComplaintVarianceView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedRetries + parsedScore;
}
