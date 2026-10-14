import * as text from "../../../../kit/text.js";
import { StrictWindowTarget } from "./strict-window-target.js";

/** How screens and exports show a strict window target. */
export class StrictWindowTargetView {
  code: string;
  labelText: string;
  startsAtText: string;
  ratioText: string;
  utmSourceText: string;
  updatedAt: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    startsAtText: string,
    ratioText: string,
    utmSourceText: string,
    updatedAt: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.startsAtText = startsAtText;
    this.ratioText = ratioText;
    this.utmSourceText = utmSourceText;
    this.updatedAt = updatedAt;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toStrictWindowTargetView(item: StrictWindowTarget): StrictWindowTargetView {
  return new StrictWindowTargetView(
    item.code,
    text.truncate(item.label, 120),
    String(item.startsAt),
    item.ratio.toFixed(2),
    item.utmSource,
    String(item.updatedAt),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictWindowTargetViews(items: StrictWindowTarget[]): StrictWindowTargetView[] {
  const views: StrictWindowTargetView[] = [];
  for (const item of items) {
    views.push(toStrictWindowTargetView(item));
  }
  return views;
}

export function sumStrictWindowTargetView(view: StrictWindowTargetView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedStartsAt + parsedRatio + parsedUpdatedAt;
}
