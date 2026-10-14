import * as text from "../../../../kit/text.js";
import { ScheduledRetentionCycle } from "./scheduled-retention-cycle.js";

/** How screens and exports show a scheduled retention cycle. */
export class ScheduledRetentionCycleView {
  codeText: string;
  label: string;
  retries: string;
  archivedText: string;
  campaignRef: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    retries: string,
    archivedText: string,
    campaignRef: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.retries = retries;
    this.archivedText = archivedText;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledRetentionCycleView(item: ScheduledRetentionCycle): ScheduledRetentionCycleView {
  return new ScheduledRetentionCycleView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    String(item.retries),
    `${item.archived}`,
    text.truncate(item.campaignRef, 80),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledRetentionCycleViews(items: ScheduledRetentionCycle[]): ScheduledRetentionCycleView[] {
  const views: ScheduledRetentionCycleView[] = [];
  for (const item of items) {
    views.push(toScheduledRetentionCycleView(item));
  }
  return views;
}

export function sumScheduledRetentionCycleView(view: ScheduledRetentionCycleView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRetries;
}
