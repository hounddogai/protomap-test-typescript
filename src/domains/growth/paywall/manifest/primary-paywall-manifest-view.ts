import * as text from "../../../../kit/text.js";
import { PrimaryPaywallManifest } from "./primary-paywall-manifest.js";

/** How screens and exports show a primary paywall manifest. */
export class PrimaryPaywallManifestView {
  codeText: string;
  label: string;
  segment: string;
  clicks: string;
  country: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    segment: string,
    clicks: string,
    country: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.segment = segment;
    this.clicks = clicks;
    this.country = country;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPaywallManifestView(item: PrimaryPaywallManifest): PrimaryPaywallManifestView {
  return new PrimaryPaywallManifestView(
    item.code,
    text.truncate(item.label, 120),
    item.segment,
    String(item.clicks),
    text.truncate(item.country, 40),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPaywallManifestViews(items: PrimaryPaywallManifest[]): PrimaryPaywallManifestView[] {
  const views: PrimaryPaywallManifestView[] = [];
  for (const item of items) {
    views.push(toPrimaryPaywallManifestView(item));
  }
  return views;
}

export function sumPrimaryPaywallManifestView(view: PrimaryPaywallManifestView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedClicks;
}
