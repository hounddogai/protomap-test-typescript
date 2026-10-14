import { LegacySuppressionVariance } from "./legacy-suppression-variance.js";

/** How screens and exports show a legacy suppression variance. */
export class LegacySuppressionVarianceView {
  code: string;
  titleText: string;
  notesText: string;
  frequencyCap: string;
  segment: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    notesText: string,
    frequencyCap: string,
    segment: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.notesText = notesText;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySuppressionVarianceView(item: LegacySuppressionVariance): LegacySuppressionVarianceView {
  return new LegacySuppressionVarianceView(
    item.code,
    item.title,
    item.notes,
    String(item.frequencyCap),
    item.segment,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySuppressionVarianceViews(items: LegacySuppressionVariance[]): LegacySuppressionVarianceView[] {
  const views: LegacySuppressionVarianceView[] = [];
  for (const item of items) {
    views.push(toLegacySuppressionVarianceView(item));
  }
  return views;
}

export function sumLegacySuppressionVarianceView(view: LegacySuppressionVarianceView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFrequencyCap;
}
