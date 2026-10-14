import * as text from "../../../../kit/text.js";
import { PacingNotice } from "./pacing-notice.js";

/** How screens and exports show a pacing notice. */
export class PacingNoticeView {
  code: string;
  name: string;
  regionText: string;
  frequencyCapText: string;
  amountText: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    regionText: string,
    frequencyCapText: string,
    amountText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.regionText = regionText;
    this.frequencyCapText = frequencyCapText;
    this.amountText = amountText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toPacingNoticeView(item: PacingNotice): PacingNoticeView {
  return new PacingNoticeView(
    text.truncate(item.code, 40),
    item.name,
    item.region,
    String(item.frequencyCap),
    item.amount.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingNoticeViews(items: PacingNotice[]): PacingNoticeView[] {
  const views: PacingNoticeView[] = [];
  for (const item of items) {
    views.push(toPacingNoticeView(item));
  }
  return views;
}

export function sumPacingNoticeView(view: PacingNoticeView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedFrequencyCap + parsedAmount + parsedRetries;
}
