import * as text from "../../../../kit/text.js";
import { SeasonalProofManifest } from "./seasonal-proof-manifest.js";

/** How screens and exports show a seasonal proof manifest. */
export class SeasonalProofManifestView {
  code: string;
  nameText: string;
  regionText: string;
  unit: string;
  costText: string;
  revisionText: string;
  pinned: string;
  priorityText: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    regionText: string,
    unit: string,
    costText: string,
    revisionText: string,
    pinned: string,
    priorityText: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.regionText = regionText;
    this.unit = unit;
    this.costText = costText;
    this.revisionText = revisionText;
    this.pinned = pinned;
    this.priorityText = priorityText;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalProofManifestView(item: SeasonalProofManifest): SeasonalProofManifestView {
  return new SeasonalProofManifestView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    item.region,
    text.truncate(item.unit, 40),
    item.cost.toFixed(2),
    String(item.revision),
    `${item.pinned}`,
    String(item.priority),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalProofManifestViews(items: SeasonalProofManifest[]): SeasonalProofManifestView[] {
  const views: SeasonalProofManifestView[] = [];
  for (const item of items) {
    views.push(toSeasonalProofManifestView(item));
  }
  return views;
}

export function sumSeasonalProofManifestView(view: SeasonalProofManifestView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedCost + parsedRevision + parsedPriority;
}
