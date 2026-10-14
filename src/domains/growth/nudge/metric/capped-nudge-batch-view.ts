import { CappedNudgeBatch } from "./capped-nudge-batch.js";

/** How screens and exports show a capped nudge batch. */
export class CappedNudgeBatchView {
  code: string;
  label: string;
  active: string;
  segmentText: string;
  conversionRate: string;
  summaryText: string;
  rateText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    active: string,
    segmentText: string,
    conversionRate: string,
    summaryText: string,
    rateText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.segmentText = segmentText;
    this.conversionRate = conversionRate;
    this.summaryText = summaryText;
    this.rateText = rateText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toCappedNudgeBatchView(item: CappedNudgeBatch): CappedNudgeBatchView {
  return new CappedNudgeBatchView(
    item.code,
    item.label,
    `${item.active}`,
    item.segment,
    item.conversionRate.toFixed(2),
    item.summary,
    item.rate.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedNudgeBatchViews(items: CappedNudgeBatch[]): CappedNudgeBatchView[] {
  const views: CappedNudgeBatchView[] = [];
  for (const item of items) {
    views.push(toCappedNudgeBatchView(item));
  }
  return views;
}

export function sumCappedNudgeBatchView(view: CappedNudgeBatchView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedConversionRate + parsedRate + parsedSequence;
}
