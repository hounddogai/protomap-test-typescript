import { LegacySenderSnapshot } from "./legacy-sender-snapshot.js";

/** How screens and exports show a legacy sender snapshot. */
export class LegacySenderSnapshotView {
  code: string;
  name: string;
  windowDaysText: string;
  updatedAt: string;
  active: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    windowDaysText: string,
    updatedAt: string,
    active: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.windowDaysText = windowDaysText;
    this.updatedAt = updatedAt;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toLegacySenderSnapshotView(item: LegacySenderSnapshot): LegacySenderSnapshotView {
  return new LegacySenderSnapshotView(
    item.code,
    item.name,
    String(item.windowDays),
    String(item.updatedAt),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacySenderSnapshotViews(items: LegacySenderSnapshot[]): LegacySenderSnapshotView[] {
  const views: LegacySenderSnapshotView[] = [];
  for (const item of items) {
    views.push(toLegacySenderSnapshotView(item));
  }
  return views;
}

export function sumLegacySenderSnapshotView(view: LegacySenderSnapshotView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedWindowDays + parsedUpdatedAt;
}
