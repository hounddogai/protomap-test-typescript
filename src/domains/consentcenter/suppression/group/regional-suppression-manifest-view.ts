import * as text from "../../../../kit/text.js";
import { RegionalSuppressionManifest } from "./regional-suppression-manifest.js";

/** How screens and exports show a regional suppression manifest. */
export class RegionalSuppressionManifestView {
  code: string;
  label: string;
  sequenceText: string;
  campaignRefText: string;
  source: string;
  weight: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sequenceText: string,
    campaignRefText: string,
    source: string,
    weight: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sequenceText = sequenceText;
    this.campaignRefText = campaignRefText;
    this.source = source;
    this.weight = weight;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSuppressionManifestView(item: RegionalSuppressionManifest): RegionalSuppressionManifestView {
  return new RegionalSuppressionManifestView(
    item.code,
    item.label,
    String(item.sequence),
    text.truncate(item.campaignRef, 120),
    item.source,
    item.weight.toFixed(2),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSuppressionManifestViews(items: RegionalSuppressionManifest[]): RegionalSuppressionManifestView[] {
  const views: RegionalSuppressionManifestView[] = [];
  for (const item of items) {
    views.push(toRegionalSuppressionManifestView(item));
  }
  return views;
}

export function sumRegionalSuppressionManifestView(view: RegionalSuppressionManifestView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedSequence + parsedWeight;
}
