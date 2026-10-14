import { BatchedFrequencyCycle } from "./batched-frequency-cycle.js";

/** How screens and exports show a batched frequency cycle. */
export class BatchedFrequencyCycleView {
  codeText: string;
  labelText: string;
  notes: string;
  frequencyCap: string;
  clicks: string;
  revision: string;
  summaryText: string;
  campaignRef: string;
  quantity: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    notes: string,
    frequencyCap: string,
    clicks: string,
    revision: string,
    summaryText: string,
    campaignRef: string,
    quantity: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.notes = notes;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
    this.revision = revision;
    this.summaryText = summaryText;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFrequencyCycleView(item: BatchedFrequencyCycle): BatchedFrequencyCycleView {
  return new BatchedFrequencyCycleView(
    item.code,
    item.label,
    item.notes,
    String(item.frequencyCap),
    String(item.clicks),
    String(item.revision),
    item.summary,
    item.campaignRef,
    String(item.quantity),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFrequencyCycleViews(items: BatchedFrequencyCycle[]): BatchedFrequencyCycleView[] {
  const views: BatchedFrequencyCycleView[] = [];
  for (const item of items) {
    views.push(toBatchedFrequencyCycleView(item));
  }
  return views;
}

export function sumBatchedFrequencyCycleView(view: BatchedFrequencyCycleView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedFrequencyCap + parsedClicks + parsedRevision;
}
