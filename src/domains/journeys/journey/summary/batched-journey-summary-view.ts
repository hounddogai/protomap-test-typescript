import * as text from "../../../../kit/text.js";
import { BatchedJourneySummary } from "./batched-journey-summary.js";

/** How screens and exports show a batched journey summary. */
export class BatchedJourneySummaryView {
  codeText: string;
  title: string;
  rateText: string;
  frequencyCapText: string;
  graceDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    rateText: string,
    frequencyCapText: string,
    graceDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.rateText = rateText;
    this.frequencyCapText = frequencyCapText;
    this.graceDays = graceDays;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedJourneySummaryView(item: BatchedJourneySummary): BatchedJourneySummaryView {
  return new BatchedJourneySummaryView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    item.rate.toFixed(2),
    String(item.frequencyCap),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedJourneySummaryViews(items: BatchedJourneySummary[]): BatchedJourneySummaryView[] {
  const views: BatchedJourneySummaryView[] = [];
  for (const item of items) {
    views.push(toBatchedJourneySummaryView(item));
  }
  return views;
}

export function sumBatchedJourneySummaryView(view: BatchedJourneySummaryView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedRate + parsedFrequencyCap + parsedGraceDays;
}
