import { DeflectionSnapshot } from "./deflection-snapshot.js";

/** How screens and exports show a deflection snapshot. */
export class DeflectionSnapshotView {
  code: string;
  title: string;
  windowDays: string;
  activeText: string;
  createdAtText: string;
  utmSource: string;
  pinned: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    activeText: string,
    createdAtText: string,
    utmSource: string,
    pinned: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.activeText = activeText;
    this.createdAtText = createdAtText;
    this.utmSource = utmSource;
    this.pinned = pinned;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionSnapshotView(item: DeflectionSnapshot): DeflectionSnapshotView {
  return new DeflectionSnapshotView(
    item.code,
    item.title,
    String(item.windowDays),
    `${item.active}`,
    String(item.createdAt),
    item.utmSource,
    `${item.pinned}`,
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionSnapshotViews(items: DeflectionSnapshot[]): DeflectionSnapshotView[] {
  const views: DeflectionSnapshotView[] = [];
  for (const item of items) {
    views.push(toDeflectionSnapshotView(item));
  }
  return views;
}

export function sumDeflectionSnapshotView(view: DeflectionSnapshotView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedWindowDays + parsedCreatedAt;
}
