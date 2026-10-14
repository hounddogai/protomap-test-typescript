import { LegacyPreferenceReview } from "./legacy-preference-review.js";

/** How screens and exports show a legacy preference review. */
export class LegacyPreferenceReviewView {
  code: string;
  name: string;
  timezone: string;
  phone: string;
  ceilingText: string;
  floorValueText: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    phone: string,
    ceilingText: string,
    floorValueText: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.phone = phone;
    this.ceilingText = ceilingText;
    this.floorValueText = floorValueText;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPreferenceReviewView(item: LegacyPreferenceReview): LegacyPreferenceReviewView {
  return new LegacyPreferenceReviewView(
    item.code,
    item.name,
    item.timezone,
    item.phone,
    item.ceiling.toFixed(2),
    item.floorValue.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPreferenceReviewViews(items: LegacyPreferenceReview[]): LegacyPreferenceReviewView[] {
  const views: LegacyPreferenceReviewView[] = [];
  for (const item of items) {
    views.push(toLegacyPreferenceReviewView(item));
  }
  return views;
}

export function sumLegacyPreferenceReviewView(view: LegacyPreferenceReviewView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedCeiling + parsedFloorValue;
}
