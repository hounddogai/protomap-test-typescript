import * as text from "../../../../kit/text.js";
import { RetentionMetric } from "./retention-metric.js";

/** How screens and exports show a retention metric. */
export class RetentionMetricView {
  code: string;
  nameText: string;
  revisionText: string;
  phoneText: string;
  weight: string;
  createdAt: string;
  cohort: string;
  openRate: string;
  maximum: string;
  externalRef: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    revisionText: string,
    phoneText: string,
    weight: string,
    createdAt: string,
    cohort: string,
    openRate: string,
    maximum: string,
    externalRef: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.revisionText = revisionText;
    this.phoneText = phoneText;
    this.weight = weight;
    this.createdAt = createdAt;
    this.cohort = cohort;
    this.openRate = openRate;
    this.maximum = maximum;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionMetricView(item: RetentionMetric): RetentionMetricView {
  return new RetentionMetricView(
    text.truncate(item.code, 120),
    item.name,
    String(item.revision),
    text.truncate(item.phone, 120),
    item.weight.toFixed(2),
    String(item.createdAt),
    text.truncate(item.cohort, 40),
    item.openRate.toFixed(2),
    item.maximum.toFixed(2),
    item.externalRef,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionMetricViews(items: RetentionMetric[]): RetentionMetricView[] {
  const views: RetentionMetricView[] = [];
  for (const item of items) {
    views.push(toRetentionMetricView(item));
  }
  return views;
}

export function sumRetentionMetricView(view: RetentionMetricView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRevision + parsedWeight + parsedCreatedAt;
}
