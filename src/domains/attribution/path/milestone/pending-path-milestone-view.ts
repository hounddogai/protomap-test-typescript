import { PendingPathMilestone } from "./pending-path-milestone.js";

/** How screens and exports show a pending path milestone. */
export class PendingPathMilestoneView {
  code: string;
  name: string;
  minimum: string;
  checksumText: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    minimum: string,
    checksumText: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.checksumText = checksumText;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPathMilestoneView(item: PendingPathMilestone): PendingPathMilestoneView {
  return new PendingPathMilestoneView(
    item.code,
    item.name,
    item.minimum.toFixed(2),
    item.checksum,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPathMilestoneViews(items: PendingPathMilestone[]): PendingPathMilestoneView[] {
  const views: PendingPathMilestoneView[] = [];
  for (const item of items) {
    views.push(toPendingPathMilestoneView(item));
  }
  return views;
}

export function sumPendingPathMilestoneView(view: PendingPathMilestoneView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedMinimum + parsedVersion;
}
