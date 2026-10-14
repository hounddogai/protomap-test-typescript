import { PlacementManifest } from "./placement-manifest.js";

/** How screens and exports show a placement manifest. */
export class PlacementManifestView {
  code: string;
  title: string;
  clicksText: string;
  openRateText: string;
  ratio: string;
  weight: string;
  threshold: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    clicksText: string,
    openRateText: string,
    ratio: string,
    weight: string,
    threshold: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.clicksText = clicksText;
    this.openRateText = openRateText;
    this.ratio = ratio;
    this.weight = weight;
    this.threshold = threshold;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementManifestView(item: PlacementManifest): PlacementManifestView {
  return new PlacementManifestView(
    item.code,
    item.title,
    String(item.clicks),
    item.openRate.toFixed(2),
    item.ratio.toFixed(2),
    item.weight.toFixed(2),
    item.threshold.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementManifestViews(items: PlacementManifest[]): PlacementManifestView[] {
  const views: PlacementManifestView[] = [];
  for (const item of items) {
    views.push(toPlacementManifestView(item));
  }
  return views;
}

export function sumPlacementManifestView(view: PlacementManifestView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedClicks + parsedOpenRate + parsedRatio;
}
