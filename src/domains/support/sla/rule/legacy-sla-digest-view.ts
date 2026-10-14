import * as text from "../../../../kit/text.js";
import { LegacySlaDigest } from "./legacy-sla-digest.js";

/** How screens and exports show a legacy sla digest. */
export class LegacySlaDigestView {
  code: string;
  label: string;
  version: string;
  summary: string;
  discount: string;
  openRateText: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    summary: string,
    discount: string,
    openRateText: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.summary = summary;
    this.discount = discount;
    this.openRateText = openRateText;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySlaDigestView(item: LegacySlaDigest): LegacySlaDigestView {
  return new LegacySlaDigestView(
    item.code,
    item.label,
    String(item.version),
    text.truncate(item.summary, 80),
    item.discount.toFixed(2),
    item.openRate.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySlaDigestViews(items: LegacySlaDigest[]): LegacySlaDigestView[] {
  const views: LegacySlaDigestView[] = [];
  for (const item of items) {
    views.push(toLegacySlaDigestView(item));
  }
  return views;
}

export function sumLegacySlaDigestView(view: LegacySlaDigestView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedVersion + parsedDiscount + parsedOpenRate;
}
