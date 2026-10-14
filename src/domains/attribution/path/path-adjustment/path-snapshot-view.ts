import * as text from "../../../../kit/text.js";
import { PathSnapshot } from "./path-snapshot.js";

/** How screens and exports show a path snapshot. */
export class PathSnapshotView {
  code: string;
  labelText: string;
  variant: string;
  title: string;
  durationMinutes: string;
  contactEmailText: string;
  version: string;
  updatedAt: string;
  score: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    variant: string,
    title: string,
    durationMinutes: string,
    contactEmailText: string,
    version: string,
    updatedAt: string,
    score: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.variant = variant;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.contactEmailText = contactEmailText;
    this.version = version;
    this.updatedAt = updatedAt;
    this.score = score;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toPathSnapshotView(item: PathSnapshot): PathSnapshotView {
  return new PathSnapshotView(
    item.code,
    item.label,
    item.variant,
    item.title,
    String(item.durationMinutes),
    text.truncate(item.contactEmail, 80),
    String(item.version),
    String(item.updatedAt),
    item.score.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPathSnapshotViews(items: PathSnapshot[]): PathSnapshotView[] {
  const views: PathSnapshotView[] = [];
  for (const item of items) {
    views.push(toPathSnapshotView(item));
  }
  return views;
}

export function sumPathSnapshotView(view: PathSnapshotView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedDurationMinutes + parsedVersion + parsedUpdatedAt;
}
