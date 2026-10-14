import * as text from "../../../../kit/text.js";
import { BatchedFrequencyRollup } from "./batched-frequency-rollup.js";

/** How screens and exports show a batched frequency rollup. */
export class BatchedFrequencyRollupView {
  code: string;
  label: string;
  channel: string;
  frequencyCapText: string;
  campaignRef: string;
  description: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    frequencyCapText: string,
    campaignRef: string,
    description: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.frequencyCapText = frequencyCapText;
    this.campaignRef = campaignRef;
    this.description = description;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFrequencyRollupView(item: BatchedFrequencyRollup): BatchedFrequencyRollupView {
  return new BatchedFrequencyRollupView(
    item.code,
    text.truncate(item.label, 120),
    item.channel,
    String(item.frequencyCap),
    text.truncate(item.campaignRef, 80),
    item.description,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFrequencyRollupViews(items: BatchedFrequencyRollup[]): BatchedFrequencyRollupView[] {
  const views: BatchedFrequencyRollupView[] = [];
  for (const item of items) {
    views.push(toBatchedFrequencyRollupView(item));
  }
  return views;
}

export function sumBatchedFrequencyRollupView(view: BatchedFrequencyRollupView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedFrequencyCap + parsedOpenRate;
}
