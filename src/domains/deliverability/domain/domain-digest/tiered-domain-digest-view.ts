import * as text from "../../../../kit/text.js";
import { TieredDomainDigest } from "./tiered-domain-digest.js";

/** How screens and exports show a tiered domain digest. */
export class TieredDomainDigestView {
  codeText: string;
  label: string;
  utmSource: string;
  openRateText: string;
  segment: string;
  visible: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    utmSource: string,
    openRateText: string,
    segment: string,
    visible: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.utmSource = utmSource;
    this.openRateText = openRateText;
    this.segment = segment;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDomainDigestView(item: TieredDomainDigest): TieredDomainDigestView {
  return new TieredDomainDigestView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    text.truncate(item.utmSource, 120),
    item.openRate.toFixed(2),
    item.segment,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDomainDigestViews(items: TieredDomainDigest[]): TieredDomainDigestView[] {
  const views: TieredDomainDigestView[] = [];
  for (const item of items) {
    views.push(toTieredDomainDigestView(item));
  }
  return views;
}

export function sumTieredDomainDigestView(view: TieredDomainDigestView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedOpenRate;
}
