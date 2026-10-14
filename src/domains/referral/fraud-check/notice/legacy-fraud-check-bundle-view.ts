import * as text from "../../../../kit/text.js";
import { LegacyFraudCheckBundle } from "./legacy-fraud-check-bundle.js";

/** How screens and exports show a legacy fraud check bundle. */
export class LegacyFraudCheckBundleView {
  code: string;
  title: string;
  locale: string;
  cost: string;
  expiresAtText: string;
  notes: string;
  ratioText: string;
  pinnedText: string;
  unit: string;
  revisionText: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    cost: string,
    expiresAtText: string,
    notes: string,
    ratioText: string,
    pinnedText: string,
    unit: string,
    revisionText: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.cost = cost;
    this.expiresAtText = expiresAtText;
    this.notes = notes;
    this.ratioText = ratioText;
    this.pinnedText = pinnedText;
    this.unit = unit;
    this.revisionText = revisionText;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyFraudCheckBundleView(item: LegacyFraudCheckBundle): LegacyFraudCheckBundleView {
  return new LegacyFraudCheckBundleView(
    item.code,
    text.truncate(item.title, 120),
    item.locale,
    item.cost.toFixed(2),
    String(item.expiresAt),
    text.truncate(item.notes, 120),
    item.ratio.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.unit, 80),
    String(item.revision),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyFraudCheckBundleViews(items: LegacyFraudCheckBundle[]): LegacyFraudCheckBundleView[] {
  const views: LegacyFraudCheckBundleView[] = [];
  for (const item of items) {
    views.push(toLegacyFraudCheckBundleView(item));
  }
  return views;
}

export function sumLegacyFraudCheckBundleView(view: LegacyFraudCheckBundleView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedCost + parsedExpiresAt + parsedRatio;
}
