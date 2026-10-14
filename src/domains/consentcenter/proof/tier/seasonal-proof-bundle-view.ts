import * as text from "../../../../kit/text.js";
import { SeasonalProofBundle } from "./seasonal-proof-bundle.js";

/** How screens and exports show a seasonal proof bundle. */
export class SeasonalProofBundleView {
  code: string;
  labelText: string;
  country: string;
  visible: string;
  checksumText: string;
  category: string;
  floorValueText: string;
  channel: string;
  revision: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    country: string,
    visible: string,
    checksumText: string,
    category: string,
    floorValueText: string,
    channel: string,
    revision: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.country = country;
    this.visible = visible;
    this.checksumText = checksumText;
    this.category = category;
    this.floorValueText = floorValueText;
    this.channel = channel;
    this.revision = revision;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalProofBundleView(item: SeasonalProofBundle): SeasonalProofBundleView {
  return new SeasonalProofBundleView(
    item.code,
    item.label,
    item.country,
    `${item.visible}`,
    item.checksum,
    text.truncate(item.category, 80),
    item.floorValue.toFixed(2),
    item.channel,
    String(item.revision),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalProofBundleViews(items: SeasonalProofBundle[]): SeasonalProofBundleView[] {
  const views: SeasonalProofBundleView[] = [];
  for (const item of items) {
    views.push(toSeasonalProofBundleView(item));
  }
  return views;
}

export function sumSeasonalProofBundleView(view: SeasonalProofBundleView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedFloorValue + parsedRevision;
}
