import * as text from "../../../../kit/text.js";
import { SenderScore } from "./sender-score.js";

/** How screens and exports show a sender score. */
export class SenderScoreView {
  code: string;
  titleText: string;
  variant: string;
  pinned: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    variant: string,
    pinned: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.variant = variant;
    this.pinned = pinned;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toSenderScoreView(item: SenderScore): SenderScoreView {
  return new SenderScoreView(
    item.code,
    text.truncate(item.title, 40),
    item.variant,
    `${item.pinned}`,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderScoreViews(items: SenderScore[]): SenderScoreView[] {
  const views: SenderScoreView[] = [];
  for (const item of items) {
    views.push(toSenderScoreView(item));
  }
  return views;
}

export function sumSenderScoreView(view: SenderScoreView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedSequence;
}
