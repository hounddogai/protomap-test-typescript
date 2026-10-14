import * as text from "../../../../kit/text.js";
import { StrictPacingBundle } from "./strict-pacing-bundle.js";

/** How screens and exports show a strict pacing bundle. */
export class StrictPacingBundleView {
  code: string;
  nameText: string;
  updatedAtText: string;
  sendAtText: string;
  region: string;
  segment: string;
  minimum: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    updatedAtText: string,
    sendAtText: string,
    region: string,
    segment: string,
    minimum: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.updatedAtText = updatedAtText;
    this.sendAtText = sendAtText;
    this.region = region;
    this.segment = segment;
    this.minimum = minimum;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPacingBundleView(item: StrictPacingBundle): StrictPacingBundleView {
  return new StrictPacingBundleView(
    item.code,
    item.name,
    String(item.updatedAt),
    String(item.sendAt),
    item.region,
    text.truncate(item.segment, 120),
    item.minimum.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPacingBundleViews(items: StrictPacingBundle[]): StrictPacingBundleView[] {
  const views: StrictPacingBundleView[] = [];
  for (const item of items) {
    views.push(toStrictPacingBundleView(item));
  }
  return views;
}

export function sumStrictPacingBundleView(view: StrictPacingBundleView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedUpdatedAt + parsedSendAt + parsedMinimum;
}
