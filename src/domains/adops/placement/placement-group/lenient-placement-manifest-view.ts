import { LenientPlacementManifest } from "./lenient-placement-manifest.js";

/** How screens and exports show a lenient placement manifest. */
export class LenientPlacementManifestView {
  code: string;
  name: string;
  campaignRef: string;
  capacity: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    capacity: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toLenientPlacementManifestView(item: LenientPlacementManifest): LenientPlacementManifestView {
  return new LenientPlacementManifestView(
    item.code,
    item.name,
    item.campaignRef,
    String(item.capacity),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientPlacementManifestViews(items: LenientPlacementManifest[]): LenientPlacementManifestView[] {
  const views: LenientPlacementManifestView[] = [];
  for (const item of items) {
    views.push(toLenientPlacementManifestView(item));
  }
  return views;
}

export function sumLenientPlacementManifestView(view: LenientPlacementManifestView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedCapacity + parsedWindowDays;
}
