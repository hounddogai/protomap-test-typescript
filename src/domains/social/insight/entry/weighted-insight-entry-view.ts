import * as text from "../../../../kit/text.js";
import { WeightedInsightEntry } from "./weighted-insight-entry.js";

/** How screens and exports show a weighted insight entry. */
export class WeightedInsightEntryView {
  codeText: string;
  labelText: string;
  threshold: string;
  visible: string;
  expiresAt: string;
  revision: string;
  reviewerText: string;
  approved: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    threshold: string,
    visible: string,
    expiresAt: string,
    revision: string,
    reviewerText: string,
    approved: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.threshold = threshold;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.revision = revision;
    this.reviewerText = reviewerText;
    this.approved = approved;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedInsightEntryView(item: WeightedInsightEntry): WeightedInsightEntryView {
  return new WeightedInsightEntryView(
    item.code,
    item.label,
    item.threshold.toFixed(2),
    `${item.visible}`,
    String(item.expiresAt),
    String(item.revision),
    text.truncate(item.reviewer, 40),
    `${item.approved}`,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedInsightEntryViews(items: WeightedInsightEntry[]): WeightedInsightEntryView[] {
  const views: WeightedInsightEntryView[] = [];
  for (const item of items) {
    views.push(toWeightedInsightEntryView(item));
  }
  return views;
}

export function sumWeightedInsightEntryView(view: WeightedInsightEntryView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedThreshold + parsedExpiresAt + parsedRevision;
}
