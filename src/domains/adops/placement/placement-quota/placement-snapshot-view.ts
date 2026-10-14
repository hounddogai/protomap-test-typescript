import * as text from "../../../../kit/text.js";
import { PlacementSnapshot } from "./placement-snapshot.js";

/** How screens and exports show a placement snapshot. */
export class PlacementSnapshotView {
  codeText: string;
  label: string;
  rate: string;
  attemptsText: string;
  locale: string;
  country: string;
  createdAt: string;
  updatedAtText: string;
  timezone: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    rate: string,
    attemptsText: string,
    locale: string,
    country: string,
    createdAt: string,
    updatedAtText: string,
    timezone: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.rate = rate;
    this.attemptsText = attemptsText;
    this.locale = locale;
    this.country = country;
    this.createdAt = createdAt;
    this.updatedAtText = updatedAtText;
    this.timezone = timezone;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementSnapshotView(item: PlacementSnapshot): PlacementSnapshotView {
  return new PlacementSnapshotView(
    item.code,
    text.truncate(item.label, 64),
    item.rate.toFixed(2),
    String(item.attempts),
    item.locale,
    text.truncate(item.country, 40),
    String(item.createdAt),
    String(item.updatedAt),
    item.timezone,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementSnapshotViews(items: PlacementSnapshot[]): PlacementSnapshotView[] {
  const views: PlacementSnapshotView[] = [];
  for (const item of items) {
    views.push(toPlacementSnapshotView(item));
  }
  return views;
}

export function sumPlacementSnapshotView(view: PlacementSnapshotView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedRate + parsedAttempts + parsedCreatedAt;
}
