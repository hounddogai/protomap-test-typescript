import * as text from "../../../../kit/text.js";
import { LegacyDeflectionManifest } from "./legacy-deflection-manifest.js";

/** How screens and exports show a legacy deflection manifest. */
export class LegacyDeflectionManifestView {
  code: string;
  label: string;
  score: string;
  discount: string;
  weight: string;
  cohort: string;
  archived: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    score: string,
    discount: string,
    weight: string,
    cohort: string,
    archived: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.discount = discount;
    this.weight = weight;
    this.cohort = cohort;
    this.archived = archived;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyDeflectionManifestView(item: LegacyDeflectionManifest): LegacyDeflectionManifestView {
  return new LegacyDeflectionManifestView(
    item.code,
    text.truncate(item.label, 80),
    item.score.toFixed(2),
    item.discount.toFixed(2),
    item.weight.toFixed(2),
    item.cohort,
    `${item.archived}`,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyDeflectionManifestViews(items: LegacyDeflectionManifest[]): LegacyDeflectionManifestView[] {
  const views: LegacyDeflectionManifestView[] = [];
  for (const item of items) {
    views.push(toLegacyDeflectionManifestView(item));
  }
  return views;
}

export function sumLegacyDeflectionManifestView(view: LegacyDeflectionManifestView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedScore + parsedDiscount + parsedWeight;
}
