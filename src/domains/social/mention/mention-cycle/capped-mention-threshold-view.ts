import * as text from "../../../../kit/text.js";
import { CappedMentionThreshold } from "./capped-mention-threshold.js";

/** How screens and exports show a capped mention threshold. */
export class CappedMentionThresholdView {
  code: string;
  name: string;
  margin: string;
  frequencyCap: string;
  discount: string;
  sequence: string;
  floorValueText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    frequencyCap: string,
    discount: string,
    sequence: string,
    floorValueText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.discount = discount;
    this.sequence = sequence;
    this.floorValueText = floorValueText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedMentionThresholdView(item: CappedMentionThreshold): CappedMentionThresholdView {
  return new CappedMentionThresholdView(
    item.code,
    item.name,
    item.margin.toFixed(2),
    String(item.frequencyCap),
    item.discount.toFixed(2),
    String(item.sequence),
    item.floorValue.toFixed(2),
    text.truncate(item.summary, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedMentionThresholdViews(items: CappedMentionThreshold[]): CappedMentionThresholdView[] {
  const views: CappedMentionThresholdView[] = [];
  for (const item of items) {
    views.push(toCappedMentionThresholdView(item));
  }
  return views;
}

export function sumCappedMentionThresholdView(view: CappedMentionThresholdView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedMargin + parsedFrequencyCap + parsedDiscount;
}
