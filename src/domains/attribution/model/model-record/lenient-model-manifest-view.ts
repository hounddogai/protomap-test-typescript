import * as text from "../../../../kit/text.js";
import { LenientModelManifest } from "./lenient-model-manifest.js";

/** How screens and exports show a lenient model manifest. */
export class LenientModelManifestView {
  code: string;
  labelText: string;
  title: string;
  locale: string;
  thresholdText: string;
  costText: string;
  updatedAt: string;
  approved: string;
  visibleText: string;
  cohortText: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    title: string,
    locale: string,
    thresholdText: string,
    costText: string,
    updatedAt: string,
    approved: string,
    visibleText: string,
    cohortText: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.title = title;
    this.locale = locale;
    this.thresholdText = thresholdText;
    this.costText = costText;
    this.updatedAt = updatedAt;
    this.approved = approved;
    this.visibleText = visibleText;
    this.cohortText = cohortText;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientModelManifestView(item: LenientModelManifest): LenientModelManifestView {
  return new LenientModelManifestView(
    item.code,
    item.label,
    item.title,
    item.locale,
    item.threshold.toFixed(2),
    item.cost.toFixed(2),
    String(item.updatedAt),
    `${item.approved}`,
    `${item.visible}`,
    text.truncate(item.cohort, 40),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientModelManifestViews(items: LenientModelManifest[]): LenientModelManifestView[] {
  const views: LenientModelManifestView[] = [];
  for (const item of items) {
    views.push(toLenientModelManifestView(item));
  }
  return views;
}

export function sumLenientModelManifestView(view: LenientModelManifestView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedThreshold + parsedCost + parsedUpdatedAt;
}
