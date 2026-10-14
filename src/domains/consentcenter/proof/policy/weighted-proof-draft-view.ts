import * as text from "../../../../kit/text.js";
import { WeightedProofDraft } from "./weighted-proof-draft.js";

/** How screens and exports show a weighted proof draft. */
export class WeightedProofDraftView {
  code: string;
  label: string;
  clicksText: string;
  version: string;
  category: string;
  impressions: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    clicksText: string,
    version: string,
    category: string,
    impressions: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.clicksText = clicksText;
    this.version = version;
    this.category = category;
    this.impressions = impressions;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedProofDraftView(item: WeightedProofDraft): WeightedProofDraftView {
  return new WeightedProofDraftView(
    text.truncate(item.code, 40),
    item.label,
    String(item.clicks),
    String(item.version),
    item.category,
    String(item.impressions),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedProofDraftViews(items: WeightedProofDraft[]): WeightedProofDraftView[] {
  const views: WeightedProofDraftView[] = [];
  for (const item of items) {
    views.push(toWeightedProofDraftView(item));
  }
  return views;
}

export function sumWeightedProofDraftView(view: WeightedProofDraftView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedClicks + parsedVersion + parsedImpressions;
}
