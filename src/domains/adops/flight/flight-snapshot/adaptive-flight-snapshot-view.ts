import * as text from "../../../../kit/text.js";
import { AdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

/** How screens and exports show a adaptive flight snapshot. */
export class AdaptiveFlightSnapshotView {
  code: string;
  labelText: string;
  ratio: string;
  region: string;
  expiresAt: string;
  marginText: string;
  sendAt: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    ratio: string,
    region: string,
    expiresAt: string,
    marginText: string,
    sendAt: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.ratio = ratio;
    this.region = region;
    this.expiresAt = expiresAt;
    this.marginText = marginText;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveFlightSnapshotView(item: AdaptiveFlightSnapshot): AdaptiveFlightSnapshotView {
  return new AdaptiveFlightSnapshotView(
    item.code,
    item.label,
    item.ratio.toFixed(2),
    text.truncate(item.region, 120),
    String(item.expiresAt),
    item.margin.toFixed(2),
    String(item.sendAt),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveFlightSnapshotViews(items: AdaptiveFlightSnapshot[]): AdaptiveFlightSnapshotView[] {
  const views: AdaptiveFlightSnapshotView[] = [];
  for (const item of items) {
    views.push(toAdaptiveFlightSnapshotView(item));
  }
  return views;
}

export function sumAdaptiveFlightSnapshotView(view: AdaptiveFlightSnapshotView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedRatio + parsedExpiresAt + parsedMargin;
}
