import * as text from "../../../../kit/text.js";
import { LenientSenderDigest } from "./lenient-sender-digest.js";

/** How screens and exports show a lenient sender digest. */
export class LenientSenderDigestView {
  code: string;
  name: string;
  weight: string;
  externalRef: string;
  active: string;
  utmSource: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    weight: string,
    externalRef: string,
    active: string,
    utmSource: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.externalRef = externalRef;
    this.active = active;
    this.utmSource = utmSource;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSenderDigestView(item: LenientSenderDigest): LenientSenderDigestView {
  return new LenientSenderDigestView(
    item.code,
    text.truncate(item.name, 120),
    item.weight.toFixed(2),
    text.truncate(item.externalRef, 40),
    `${item.active}`,
    item.utmSource,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSenderDigestViews(items: LenientSenderDigest[]): LenientSenderDigestView[] {
  const views: LenientSenderDigestView[] = [];
  for (const item of items) {
    views.push(toLenientSenderDigestView(item));
  }
  return views;
}

export function sumLenientSenderDigestView(view: LenientSenderDigestView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedWeight + parsedImpressions;
}
