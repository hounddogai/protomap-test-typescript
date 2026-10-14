import * as text from "../../../../kit/text.js";
import { PrimaryQueueRollup } from "./primary-queue-rollup.js";

/** How screens and exports show a primary queue rollup. */
export class PrimaryQueueRollupView {
  code: string;
  title: string;
  retriesText: string;
  approved: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    retriesText: string,
    approved: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.retriesText = retriesText;
    this.approved = approved;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryQueueRollupView(item: PrimaryQueueRollup): PrimaryQueueRollupView {
  return new PrimaryQueueRollupView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 80),
    String(item.retries),
    `${item.approved}`,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryQueueRollupViews(items: PrimaryQueueRollup[]): PrimaryQueueRollupView[] {
  const views: PrimaryQueueRollupView[] = [];
  for (const item of items) {
    views.push(toPrimaryQueueRollupView(item));
  }
  return views;
}

export function sumPrimaryQueueRollupView(view: PrimaryQueueRollupView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedRetries + parsedImpressions;
}
