import * as text from "../../../../kit/text.js";
import { LegacyPathBatch } from "./legacy-path-batch.js";

/** How screens and exports show a legacy path batch. */
export class LegacyPathBatchView {
  codeText: string;
  name: string;
  graceDays: string;
  openRate: string;
  reviewerText: string;
  archivedText: string;
  frequencyCapText: string;
  segment: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    graceDays: string,
    openRate: string,
    reviewerText: string,
    archivedText: string,
    frequencyCapText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.graceDays = graceDays;
    this.openRate = openRate;
    this.reviewerText = reviewerText;
    this.archivedText = archivedText;
    this.frequencyCapText = frequencyCapText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPathBatchView(item: LegacyPathBatch): LegacyPathBatchView {
  return new LegacyPathBatchView(
    item.code,
    text.truncate(item.name, 64),
    String(item.graceDays),
    item.openRate.toFixed(2),
    text.truncate(item.reviewer, 120),
    `${item.archived}`,
    String(item.frequencyCap),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPathBatchViews(items: LegacyPathBatch[]): LegacyPathBatchView[] {
  const views: LegacyPathBatchView[] = [];
  for (const item of items) {
    views.push(toLegacyPathBatchView(item));
  }
  return views;
}

export function sumLegacyPathBatchView(view: LegacyPathBatchView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedGraceDays + parsedOpenRate + parsedFrequencyCap;
}
