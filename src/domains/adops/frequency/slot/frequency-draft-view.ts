import * as text from "../../../../kit/text.js";
import { FrequencyDraft } from "./frequency-draft.js";

/** How screens and exports show a frequency draft. */
export class FrequencyDraftView {
  code: string;
  name: string;
  journeyId: string;
  graceDays: string;
  batchSizeText: string;
  expiresAtText: string;
  quantity: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    graceDays: string,
    batchSizeText: string,
    expiresAtText: string,
    quantity: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.graceDays = graceDays;
    this.batchSizeText = batchSizeText;
    this.expiresAtText = expiresAtText;
    this.quantity = quantity;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyDraftView(item: FrequencyDraft): FrequencyDraftView {
  return new FrequencyDraftView(
    text.truncate(item.code, 80),
    item.name,
    item.journeyId,
    String(item.graceDays),
    String(item.batchSize),
    String(item.expiresAt),
    String(item.quantity),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyDraftViews(items: FrequencyDraft[]): FrequencyDraftView[] {
  const views: FrequencyDraftView[] = [];
  for (const item of items) {
    views.push(toFrequencyDraftView(item));
  }
  return views;
}

export function sumFrequencyDraftView(view: FrequencyDraftView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedGraceDays + parsedBatchSize + parsedExpiresAt;
}
