import * as text from "../../../../kit/text.js";
import { BatchedConversionBundle } from "./batched-conversion-bundle.js";

/** How screens and exports show a batched conversion bundle. */
export class BatchedConversionBundleView {
  code: string;
  label: string;
  threshold: string;
  activeText: string;
  frequencyCapText: string;
  ceilingText: string;
  currencyText: string;
  notesText: string;
  campaignRefText: string;
  createdAt: string;
  minimumText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    activeText: string,
    frequencyCapText: string,
    ceilingText: string,
    currencyText: string,
    notesText: string,
    campaignRefText: string,
    createdAt: string,
    minimumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.activeText = activeText;
    this.frequencyCapText = frequencyCapText;
    this.ceilingText = ceilingText;
    this.currencyText = currencyText;
    this.notesText = notesText;
    this.campaignRefText = campaignRefText;
    this.createdAt = createdAt;
    this.minimumText = minimumText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedConversionBundleView(item: BatchedConversionBundle): BatchedConversionBundleView {
  return new BatchedConversionBundleView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    item.threshold.toFixed(2),
    `${item.active}`,
    String(item.frequencyCap),
    item.ceiling.toFixed(2),
    item.currency,
    item.notes,
    text.truncate(item.campaignRef, 64),
    String(item.createdAt),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedConversionBundleViews(items: BatchedConversionBundle[]): BatchedConversionBundleView[] {
  const views: BatchedConversionBundleView[] = [];
  for (const item of items) {
    views.push(toBatchedConversionBundleView(item));
  }
  return views;
}

export function sumBatchedConversionBundleView(view: BatchedConversionBundleView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedThreshold + parsedFrequencyCap + parsedCeiling;
}
