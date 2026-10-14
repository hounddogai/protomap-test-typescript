import * as text from "../../../../kit/text.js";
import { PrimaryNudgeVariance } from "./primary-nudge-variance.js";

/** How screens and exports show a primary nudge variance. */
export class PrimaryNudgeVarianceView {
  code: string;
  titleText: string;
  minimum: string;
  contactEmail: string;
  revision: string;
  expiresAt: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    minimum: string,
    contactEmail: string,
    revision: string,
    expiresAt: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryNudgeVarianceView(item: PrimaryNudgeVariance): PrimaryNudgeVarianceView {
  return new PrimaryNudgeVarianceView(
    item.code,
    text.truncate(item.title, 64),
    item.minimum.toFixed(2),
    item.contactEmail,
    String(item.revision),
    String(item.expiresAt),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryNudgeVarianceViews(items: PrimaryNudgeVariance[]): PrimaryNudgeVarianceView[] {
  const views: PrimaryNudgeVarianceView[] = [];
  for (const item of items) {
    views.push(toPrimaryNudgeVarianceView(item));
  }
  return views;
}

export function sumPrimaryNudgeVarianceView(view: PrimaryNudgeVarianceView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedMinimum + parsedRevision + parsedExpiresAt;
}
