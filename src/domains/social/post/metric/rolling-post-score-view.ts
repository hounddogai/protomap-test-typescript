import * as text from "../../../../kit/text.js";
import { RollingPostScore } from "./rolling-post-score.js";

/** How screens and exports show a rolling post score. */
export class RollingPostScoreView {
  codeText: string;
  title: string;
  openRate: string;
  currencyText: string;
  threshold: string;
  capacity: string;
  description: string;
  revision: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    openRate: string,
    currencyText: string,
    threshold: string,
    capacity: string,
    description: string,
    revision: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.openRate = openRate;
    this.currencyText = currencyText;
    this.threshold = threshold;
    this.capacity = capacity;
    this.description = description;
    this.revision = revision;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPostScoreView(item: RollingPostScore): RollingPostScoreView {
  return new RollingPostScoreView(
    item.code,
    text.truncate(item.title, 120),
    item.openRate.toFixed(2),
    item.currency,
    item.threshold.toFixed(2),
    String(item.capacity),
    item.description,
    String(item.revision),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPostScoreViews(items: RollingPostScore[]): RollingPostScoreView[] {
  const views: RollingPostScoreView[] = [];
  for (const item of items) {
    views.push(toRollingPostScoreView(item));
  }
  return views;
}

export function sumRollingPostScoreView(view: RollingPostScoreView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedOpenRate + parsedThreshold + parsedCapacity;
}
