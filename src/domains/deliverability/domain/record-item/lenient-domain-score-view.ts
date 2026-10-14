import { LenientDomainScore } from "./lenient-domain-score.js";

/** How screens and exports show a lenient domain score. */
export class LenientDomainScoreView {
  code: string;
  label: string;
  notes: string;
  minimum: string;
  ratio: string;
  statusLabel: string;

  constructor(code: string, label: string, notes: string, minimum: string, ratio: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.minimum = minimum;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toLenientDomainScoreView(item: LenientDomainScore): LenientDomainScoreView {
  return new LenientDomainScoreView(
    item.code,
    item.label,
    item.notes,
    item.minimum.toFixed(2),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientDomainScoreViews(items: LenientDomainScore[]): LenientDomainScoreView[] {
  const views: LenientDomainScoreView[] = [];
  for (const item of items) {
    views.push(toLenientDomainScoreView(item));
  }
  return views;
}

export function sumLenientDomainScoreView(view: LenientDomainScoreView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedMinimum + parsedRatio;
}
