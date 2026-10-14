import * as text from "../../../../kit/text.js";
import { StrictMacroTarget } from "./strict-macro-target.js";

/** How screens and exports show a strict macro target. */
export class StrictMacroTargetView {
  code: string;
  nameText: string;
  threshold: string;
  externalRefText: string;
  frequencyCapText: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    threshold: string,
    externalRefText: string,
    frequencyCapText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.threshold = threshold;
    this.externalRefText = externalRefText;
    this.frequencyCapText = frequencyCapText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toStrictMacroTargetView(item: StrictMacroTarget): StrictMacroTargetView {
  return new StrictMacroTargetView(
    item.code,
    text.truncate(item.name, 64),
    item.threshold.toFixed(2),
    text.truncate(item.externalRef, 64),
    String(item.frequencyCap),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictMacroTargetViews(items: StrictMacroTarget[]): StrictMacroTargetView[] {
  const views: StrictMacroTargetView[] = [];
  for (const item of items) {
    views.push(toStrictMacroTargetView(item));
  }
  return views;
}

export function sumStrictMacroTargetView(view: StrictMacroTargetView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedThreshold + parsedFrequencyCap + parsedBid;
}
