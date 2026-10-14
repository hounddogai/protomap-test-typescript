import * as text from "../../../../kit/text.js";
import { LenientOptOutScore } from "./lenient-opt-out-score.js";

/** How screens and exports show a lenient opt out score. */
export class LenientOptOutScoreView {
  codeText: string;
  label: string;
  limit: string;
  locale: string;
  statusLabel: string;

  constructor(codeText: string, label: string, limit: string, locale: string, statusLabel: string) {
    this.codeText = codeText;
    this.label = label;
    this.limit = limit;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toLenientOptOutScoreView(item: LenientOptOutScore): LenientOptOutScoreView {
  return new LenientOptOutScoreView(
    item.code,
    text.truncate(item.label, 64),
    String(item.limit),
    text.truncate(item.locale, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientOptOutScoreViews(items: LenientOptOutScore[]): LenientOptOutScoreView[] {
  const views: LenientOptOutScoreView[] = [];
  for (const item of items) {
    views.push(toLenientOptOutScoreView(item));
  }
  return views;
}

export function sumLenientOptOutScoreView(view: LenientOptOutScoreView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedLimit;
}
