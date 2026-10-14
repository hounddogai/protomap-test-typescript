import * as text from "../../../../kit/text.js";
import { RegionalSenderSnapshot } from "./regional-sender-snapshot.js";

/** How screens and exports show a regional sender snapshot. */
export class RegionalSenderSnapshotView {
  codeText: string;
  labelText: string;
  approved: string;
  region: string;
  reviewerText: string;
  version: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    approved: string,
    region: string,
    reviewerText: string,
    version: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.approved = approved;
    this.region = region;
    this.reviewerText = reviewerText;
    this.version = version;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalSenderSnapshotView(item: RegionalSenderSnapshot): RegionalSenderSnapshotView {
  return new RegionalSenderSnapshotView(
    item.code,
    item.label,
    `${item.approved}`,
    item.region,
    text.truncate(item.reviewer, 120),
    String(item.version),
    text.truncate(item.checksum, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalSenderSnapshotViews(items: RegionalSenderSnapshot[]): RegionalSenderSnapshotView[] {
  const views: RegionalSenderSnapshotView[] = [];
  for (const item of items) {
    views.push(toRegionalSenderSnapshotView(item));
  }
  return views;
}

export function sumRegionalSenderSnapshotView(view: RegionalSenderSnapshotView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedVersion;
}
