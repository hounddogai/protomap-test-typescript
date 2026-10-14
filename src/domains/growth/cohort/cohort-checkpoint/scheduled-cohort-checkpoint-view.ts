import * as text from "../../../../kit/text.js";
import { ScheduledCohortCheckpoint } from "./scheduled-cohort-checkpoint.js";

/** How screens and exports show a scheduled cohort checkpoint. */
export class ScheduledCohortCheckpointView {
  code: string;
  label: string;
  channel: string;
  openRate: string;
  ceiling: string;
  externalRef: string;
  threshold: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    openRate: string,
    ceiling: string,
    externalRef: string,
    threshold: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledCohortCheckpointView(item: ScheduledCohortCheckpoint): ScheduledCohortCheckpointView {
  return new ScheduledCohortCheckpointView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.channel, 120),
    item.openRate.toFixed(2),
    item.ceiling.toFixed(2),
    item.externalRef,
    item.threshold.toFixed(2),
    text.truncate(item.currency, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledCohortCheckpointViews(items: ScheduledCohortCheckpoint[]): ScheduledCohortCheckpointView[] {
  const views: ScheduledCohortCheckpointView[] = [];
  for (const item of items) {
    views.push(toScheduledCohortCheckpointView(item));
  }
  return views;
}

export function sumScheduledCohortCheckpointView(view: ScheduledCohortCheckpointView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedOpenRate + parsedCeiling + parsedThreshold;
}
