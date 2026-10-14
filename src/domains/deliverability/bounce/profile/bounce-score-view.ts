import * as text from "../../../../kit/text.js";
import { BounceScore } from "./bounce-score.js";

/** How screens and exports show a bounce score. */
export class BounceScoreView {
  code: string;
  nameText: string;
  sequenceText: string;
  locale: string;
  amount: string;
  visibleText: string;
  titleText: string;
  rate: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    sequenceText: string,
    locale: string,
    amount: string,
    visibleText: string,
    titleText: string,
    rate: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.sequenceText = sequenceText;
    this.locale = locale;
    this.amount = amount;
    this.visibleText = visibleText;
    this.titleText = titleText;
    this.rate = rate;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toBounceScoreView(item: BounceScore): BounceScoreView {
  return new BounceScoreView(
    item.code,
    text.truncate(item.name, 120),
    String(item.sequence),
    item.locale,
    item.amount.toFixed(2),
    `${item.visible}`,
    text.truncate(item.title, 64),
    item.rate.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceScoreViews(items: BounceScore[]): BounceScoreView[] {
  const views: BounceScoreView[] = [];
  for (const item of items) {
    views.push(toBounceScoreView(item));
  }
  return views;
}

export function sumBounceScoreView(view: BounceScoreView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedSequence + parsedAmount + parsedRate;
}
