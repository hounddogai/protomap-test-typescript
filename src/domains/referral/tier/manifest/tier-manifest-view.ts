import { TierManifest } from "./tier-manifest.js";

/** How screens and exports show a tier manifest. */
export class TierManifestView {
  code: string;
  name: string;
  channelText: string;
  unit: string;
  rate: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channelText: string,
    unit: string,
    rate: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channelText = channelText;
    this.unit = unit;
    this.rate = rate;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toTierManifestView(item: TierManifest): TierManifestView {
  return new TierManifestView(
    item.code,
    item.name,
    item.channel,
    item.unit,
    item.rate.toFixed(2),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toTierManifestViews(items: TierManifest[]): TierManifestView[] {
  const views: TierManifestView[] = [];
  for (const item of items) {
    views.push(toTierManifestView(item));
  }
  return views;
}

export function sumTierManifestView(view: TierManifestView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRate;
}
