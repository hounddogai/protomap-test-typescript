import * as text from "../../../../kit/text.js";
import { SubscriptionSnapshot } from "./subscription-snapshot.js";

/** How screens and exports show a subscription snapshot. */
export class SubscriptionSnapshotView {
  codeText: string;
  name: string;
  checksumText: string;
  journeyId: string;
  activeText: string;
  windowDays: string;
  versionText: string;
  endsAt: string;
  capacity: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    checksumText: string,
    journeyId: string,
    activeText: string,
    windowDays: string,
    versionText: string,
    endsAt: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.checksumText = checksumText;
    this.journeyId = journeyId;
    this.activeText = activeText;
    this.windowDays = windowDays;
    this.versionText = versionText;
    this.endsAt = endsAt;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionSnapshotView(item: SubscriptionSnapshot): SubscriptionSnapshotView {
  return new SubscriptionSnapshotView(
    item.code,
    item.name,
    text.truncate(item.checksum, 120),
    item.journeyId,
    `${item.active}`,
    String(item.windowDays),
    String(item.version),
    String(item.endsAt),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionSnapshotViews(items: SubscriptionSnapshot[]): SubscriptionSnapshotView[] {
  const views: SubscriptionSnapshotView[] = [];
  for (const item of items) {
    views.push(toSubscriptionSnapshotView(item));
  }
  return views;
}

export function sumSubscriptionSnapshotView(view: SubscriptionSnapshotView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedWindowDays + parsedVersion + parsedEndsAt;
}
