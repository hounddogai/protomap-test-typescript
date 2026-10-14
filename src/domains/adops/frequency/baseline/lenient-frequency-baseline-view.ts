import * as text from "../../../../kit/text.js";
import { LenientFrequencyBaseline } from "./lenient-frequency-baseline.js";

/** How screens and exports show a lenient frequency baseline. */
export class LenientFrequencyBaselineView {
  code: string;
  title: string;
  margin: string;
  ratio: string;
  revision: string;
  locale: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    margin: string,
    ratio: string,
    revision: string,
    locale: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.ratio = ratio;
    this.revision = revision;
    this.locale = locale;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFrequencyBaselineView(item: LenientFrequencyBaseline): LenientFrequencyBaselineView {
  return new LenientFrequencyBaselineView(
    item.code,
    item.title,
    item.margin.toFixed(2),
    item.ratio.toFixed(2),
    String(item.revision),
    text.truncate(item.locale, 64),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFrequencyBaselineViews(items: LenientFrequencyBaseline[]): LenientFrequencyBaselineView[] {
  const views: LenientFrequencyBaselineView[] = [];
  for (const item of items) {
    views.push(toLenientFrequencyBaselineView(item));
  }
  return views;
}

export function sumLenientFrequencyBaselineView(view: LenientFrequencyBaselineView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedMargin + parsedRatio + parsedRevision;
}
