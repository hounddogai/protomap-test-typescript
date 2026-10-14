import { LegacyCohortClaim } from "./legacy-cohort-claim.js";

/** How screens and exports show a legacy cohort claim. */
export class LegacyCohortClaimView {
  code: string;
  title: string;
  version: string;
  channel: string;
  floorValue: string;
  expiresAt: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    version: string,
    channel: string,
    floorValue: string,
    expiresAt: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.channel = channel;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCohortClaimView(item: LegacyCohortClaim): LegacyCohortClaimView {
  return new LegacyCohortClaimView(
    item.code,
    item.title,
    String(item.version),
    item.channel,
    item.floorValue.toFixed(2),
    String(item.expiresAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCohortClaimViews(items: LegacyCohortClaim[]): LegacyCohortClaimView[] {
  const views: LegacyCohortClaimView[] = [];
  for (const item of items) {
    views.push(toLegacyCohortClaimView(item));
  }
  return views;
}

export function sumLegacyCohortClaimView(view: LegacyCohortClaimView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedVersion + parsedFloorValue + parsedExpiresAt;
}
