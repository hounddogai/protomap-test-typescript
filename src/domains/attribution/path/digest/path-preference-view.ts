import * as text from "../../../../kit/text.js";
import { PathPreference } from "./path-preference.js";

/** How screens and exports show a path preference. */
export class PathPreferenceView {
  code: string;
  title: string;
  createdAt: string;
  checksum: string;
  floorValue: string;
  sourceText: string;
  expiresAt: string;
  region: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    createdAt: string,
    checksum: string,
    floorValue: string,
    sourceText: string,
    expiresAt: string,
    region: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.sourceText = sourceText;
    this.expiresAt = expiresAt;
    this.region = region;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toPathPreferenceView(item: PathPreference): PathPreferenceView {
  return new PathPreferenceView(
    item.code,
    item.title,
    String(item.createdAt),
    text.truncate(item.checksum, 120),
    item.floorValue.toFixed(2),
    item.source,
    String(item.expiresAt),
    item.region,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPathPreferenceViews(items: PathPreference[]): PathPreferenceView[] {
  const views: PathPreferenceView[] = [];
  for (const item of items) {
    views.push(toPathPreferenceView(item));
  }
  return views;
}

export function sumPathPreferenceView(view: PathPreferenceView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedCreatedAt + parsedFloorValue + parsedExpiresAt;
}
