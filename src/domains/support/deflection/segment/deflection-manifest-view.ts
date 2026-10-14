import * as text from "../../../../kit/text.js";
import { DeflectionManifest } from "./deflection-manifest.js";

/** How screens and exports show a deflection manifest. */
export class DeflectionManifestView {
  code: string;
  name: string;
  utmSourceText: string;
  archivedText: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    utmSourceText: string,
    archivedText: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.utmSourceText = utmSourceText;
    this.archivedText = archivedText;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionManifestView(item: DeflectionManifest): DeflectionManifestView {
  return new DeflectionManifestView(
    item.code,
    item.name,
    text.truncate(item.utmSource, 40),
    `${item.archived}`,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionManifestViews(items: DeflectionManifest[]): DeflectionManifestView[] {
  const views: DeflectionManifestView[] = [];
  for (const item of items) {
    views.push(toDeflectionManifestView(item));
  }
  return views;
}

export function sumDeflectionManifestView(view: DeflectionManifestView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedBid;
}
