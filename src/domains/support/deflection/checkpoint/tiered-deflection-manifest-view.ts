import { TieredDeflectionManifest } from "./tiered-deflection-manifest.js";

/** How screens and exports show a tiered deflection manifest. */
export class TieredDeflectionManifestView {
  code: string;
  title: string;
  thresholdText: string;
  utmSourceText: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    thresholdText: string,
    utmSourceText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.thresholdText = thresholdText;
    this.utmSourceText = utmSourceText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toTieredDeflectionManifestView(item: TieredDeflectionManifest): TieredDeflectionManifestView {
  return new TieredDeflectionManifestView(
    item.code,
    item.title,
    item.threshold.toFixed(2),
    item.utmSource,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredDeflectionManifestViews(items: TieredDeflectionManifest[]): TieredDeflectionManifestView[] {
  const views: TieredDeflectionManifestView[] = [];
  for (const item of items) {
    views.push(toTieredDeflectionManifestView(item));
  }
  return views;
}

export function sumTieredDeflectionManifestView(view: TieredDeflectionManifestView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedThreshold + parsedPriority;
}
