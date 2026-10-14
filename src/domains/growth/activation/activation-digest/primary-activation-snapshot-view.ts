import * as text from "../../../../kit/text.js";
import { PrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

/** How screens and exports show a primary activation snapshot. */
export class PrimaryActivationSnapshotView {
  code: string;
  labelText: string;
  version: string;
  campaignRef: string;
  openRate: string;
  locale: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    version: string,
    campaignRef: string,
    openRate: string,
    locale: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.version = version;
    this.campaignRef = campaignRef;
    this.openRate = openRate;
    this.locale = locale;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryActivationSnapshotView(item: PrimaryActivationSnapshot): PrimaryActivationSnapshotView {
  return new PrimaryActivationSnapshotView(
    item.code,
    item.label,
    String(item.version),
    item.campaignRef,
    item.openRate.toFixed(2),
    text.truncate(item.locale, 120),
    text.truncate(item.category, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryActivationSnapshotViews(items: PrimaryActivationSnapshot[]): PrimaryActivationSnapshotView[] {
  const views: PrimaryActivationSnapshotView[] = [];
  for (const item of items) {
    views.push(toPrimaryActivationSnapshotView(item));
  }
  return views;
}

export function sumPrimaryActivationSnapshotView(view: PrimaryActivationSnapshotView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedVersion + parsedOpenRate;
}
