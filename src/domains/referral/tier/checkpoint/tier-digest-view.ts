import { TierDigest } from "./tier-digest.js";

/** How screens and exports show a tier digest. */
export class TierDigestView {
  codeText: string;
  label: string;
  revisionText: string;
  name: string;
  rate: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    revisionText: string,
    name: string,
    rate: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.revisionText = revisionText;
    this.name = name;
    this.rate = rate;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toTierDigestView(item: TierDigest): TierDigestView {
  return new TierDigestView(
    item.code,
    item.label,
    String(item.revision),
    item.name,
    item.rate.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierDigestViews(items: TierDigest[]): TierDigestView[] {
  const views: TierDigestView[] = [];
  for (const item of items) {
    views.push(toTierDigestView(item));
  }
  return views;
}

export function sumTierDigestView(view: TierDigestView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedRevision + parsedRate + parsedFloorValue;
}
