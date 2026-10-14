import * as text from "../../../../kit/text.js";
import { PayoutPreference } from "./payout-preference.js";

/** How screens and exports show a payout preference. */
export class PayoutPreferenceView {
  codeText: string;
  title: string;
  ratio: string;
  batchSizeText: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ratio: string,
    batchSizeText: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ratio = ratio;
    this.batchSizeText = batchSizeText;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutPreferenceView(item: PayoutPreference): PayoutPreferenceView {
  return new PayoutPreferenceView(
    item.code,
    text.truncate(item.title, 80),
    item.ratio.toFixed(2),
    String(item.batchSize),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutPreferenceViews(items: PayoutPreference[]): PayoutPreferenceView[] {
  const views: PayoutPreferenceView[] = [];
  for (const item of items) {
    views.push(toPayoutPreferenceView(item));
  }
  return views;
}

export function sumPayoutPreferenceView(view: PayoutPreferenceView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  return parsedRatio + parsedBatchSize + parsedEndsAt;
}
