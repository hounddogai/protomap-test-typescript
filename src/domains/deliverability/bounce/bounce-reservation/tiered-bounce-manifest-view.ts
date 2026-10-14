import * as text from "../../../../kit/text.js";
import { TieredBounceManifest } from "./tiered-bounce-manifest.js";

/** How screens and exports show a tiered bounce manifest. */
export class TieredBounceManifestView {
  codeText: string;
  title: string;
  segment: string;
  revisionText: string;
  locale: string;
  approvedText: string;
  cost: string;
  notes: string;
  minimum: string;
  description: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    segment: string,
    revisionText: string,
    locale: string,
    approvedText: string,
    cost: string,
    notes: string,
    minimum: string,
    description: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.segment = segment;
    this.revisionText = revisionText;
    this.locale = locale;
    this.approvedText = approvedText;
    this.cost = cost;
    this.notes = notes;
    this.minimum = minimum;
    this.description = description;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBounceManifestView(item: TieredBounceManifest): TieredBounceManifestView {
  return new TieredBounceManifestView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 40),
    item.segment,
    String(item.revision),
    item.locale,
    `${item.approved}`,
    item.cost.toFixed(2),
    item.notes,
    item.minimum.toFixed(2),
    item.description,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBounceManifestViews(items: TieredBounceManifest[]): TieredBounceManifestView[] {
  const views: TieredBounceManifestView[] = [];
  for (const item of items) {
    views.push(toTieredBounceManifestView(item));
  }
  return views;
}

export function sumTieredBounceManifestView(view: TieredBounceManifestView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedRevision + parsedCost + parsedMinimum;
}
