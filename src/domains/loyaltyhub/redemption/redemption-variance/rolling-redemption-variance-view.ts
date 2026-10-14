import { RollingRedemptionVariance } from "./rolling-redemption-variance.js";

/** How screens and exports show a rolling redemption variance. */
export class RollingRedemptionVarianceView {
  code: string;
  nameText: string;
  source: string;
  version: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    source: string,
    version: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.source = source;
    this.version = version;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingRedemptionVarianceView(item: RollingRedemptionVariance): RollingRedemptionVarianceView {
  return new RollingRedemptionVarianceView(
    item.code,
    item.name,
    item.source,
    String(item.version),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingRedemptionVarianceViews(items: RollingRedemptionVariance[]): RollingRedemptionVarianceView[] {
  const views: RollingRedemptionVarianceView[] = [];
  for (const item of items) {
    views.push(toRollingRedemptionVarianceView(item));
  }
  return views;
}

export function sumRollingRedemptionVarianceView(view: RollingRedemptionVarianceView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedVersion;
}
