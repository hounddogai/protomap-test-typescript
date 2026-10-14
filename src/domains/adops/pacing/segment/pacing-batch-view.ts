import { PacingBatch } from "./pacing-batch.js";

/** How screens and exports show a pacing batch. */
export class PacingBatchView {
  codeText: string;
  name: string;
  ownerId: string;
  impressionsText: string;
  pinnedText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ownerId: string,
    impressionsText: string,
    pinnedText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ownerId = ownerId;
    this.impressionsText = impressionsText;
    this.pinnedText = pinnedText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toPacingBatchView(item: PacingBatch): PacingBatchView {
  return new PacingBatchView(
    item.code,
    item.name,
    item.ownerId,
    String(item.impressions),
    `${item.pinned}`,
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingBatchViews(items: PacingBatch[]): PacingBatchView[] {
  const views: PacingBatchView[] = [];
  for (const item of items) {
    views.push(toPacingBatchView(item));
  }
  return views;
}

export function sumPacingBatchView(view: PacingBatchView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedImpressions;
}
