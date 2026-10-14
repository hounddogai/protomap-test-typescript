import * as text from "../../../../kit/text.js";
import { TierProfile } from "./tier-profile.js";

/** How screens and exports show a tier profile. */
export class TierProfileView {
  code: string;
  name: string;
  floorValueText: string;
  segmentText: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValueText: string,
    segmentText: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValueText = floorValueText;
    this.segmentText = segmentText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toTierProfileView(item: TierProfile): TierProfileView {
  return new TierProfileView(
    text.truncate(item.code, 64),
    item.name,
    item.floorValue.toFixed(2),
    item.segment,
    text.truncate(item.category, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierProfileViews(items: TierProfile[]): TierProfileView[] {
  const views: TierProfileView[] = [];
  for (const item of items) {
    views.push(toTierProfileView(item));
  }
  return views;
}

export function sumTierProfileView(view: TierProfileView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedFloorValue;
}
