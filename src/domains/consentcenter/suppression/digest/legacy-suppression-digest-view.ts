import { LegacySuppressionDigest } from "./legacy-suppression-digest.js";

/** How screens and exports show a legacy suppression digest. */
export class LegacySuppressionDigestView {
  code: string;
  label: string;
  capacityText: string;
  minimum: string;
  pinnedText: string;
  frequencyCap: string;
  ceiling: string;
  limitText: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    capacityText: string,
    minimum: string,
    pinnedText: string,
    frequencyCap: string,
    ceiling: string,
    limitText: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.capacityText = capacityText;
    this.minimum = minimum;
    this.pinnedText = pinnedText;
    this.frequencyCap = frequencyCap;
    this.ceiling = ceiling;
    this.limitText = limitText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySuppressionDigestView(item: LegacySuppressionDigest): LegacySuppressionDigestView {
  return new LegacySuppressionDigestView(
    item.code,
    item.label,
    String(item.capacity),
    item.minimum.toFixed(2),
    `${item.pinned}`,
    String(item.frequencyCap),
    item.ceiling.toFixed(2),
    String(item.limit),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySuppressionDigestViews(items: LegacySuppressionDigest[]): LegacySuppressionDigestView[] {
  const views: LegacySuppressionDigestView[] = [];
  for (const item of items) {
    views.push(toLegacySuppressionDigestView(item));
  }
  return views;
}

export function sumLegacySuppressionDigestView(view: LegacySuppressionDigestView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedCapacity + parsedMinimum + parsedFrequencyCap;
}
