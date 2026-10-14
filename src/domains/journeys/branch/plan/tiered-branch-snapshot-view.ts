import * as text from "../../../../kit/text.js";
import { TieredBranchSnapshot } from "./tiered-branch-snapshot.js";

/** How screens and exports show a tiered branch snapshot. */
export class TieredBranchSnapshotView {
  code: string;
  labelText: string;
  titleText: string;
  ownerIdText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    titleText: string,
    ownerIdText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.titleText = titleText;
    this.ownerIdText = ownerIdText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredBranchSnapshotView(item: TieredBranchSnapshot): TieredBranchSnapshotView {
  return new TieredBranchSnapshotView(
    item.code,
    text.truncate(item.label, 64),
    item.title,
    item.ownerId,
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredBranchSnapshotViews(items: TieredBranchSnapshot[]): TieredBranchSnapshotView[] {
  const views: TieredBranchSnapshotView[] = [];
  for (const item of items) {
    views.push(toTieredBranchSnapshotView(item));
  }
  return views;
}

export function sumTieredBranchSnapshotView(view: TieredBranchSnapshotView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedExpiresAt;
}
