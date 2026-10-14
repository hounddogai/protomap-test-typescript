import { RegionalStreakSnapshot } from "./regional-streak-snapshot.js";

/** How screens and exports show a regional streak snapshot. */
export class RegionalStreakSnapshotView {
  codeText: string;
  title: string;
  rateText: string;
  margin: string;
  revisionText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    rateText: string,
    margin: string,
    revisionText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.rateText = rateText;
    this.margin = margin;
    this.revisionText = revisionText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalStreakSnapshotView(item: RegionalStreakSnapshot): RegionalStreakSnapshotView {
  return new RegionalStreakSnapshotView(
    item.code,
    item.title,
    item.rate.toFixed(2),
    item.margin.toFixed(2),
    String(item.revision),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalStreakSnapshotViews(items: RegionalStreakSnapshot[]): RegionalStreakSnapshotView[] {
  const views: RegionalStreakSnapshotView[] = [];
  for (const item of items) {
    views.push(toRegionalStreakSnapshotView(item));
  }
  return views;
}

export function sumRegionalStreakSnapshotView(view: RegionalStreakSnapshotView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedRate + parsedMargin + parsedRevision;
}
