import { LegacyTierEntry } from "./legacy-tier-entry.js";

/** How screens and exports show a legacy tier entry. */
export class LegacyTierEntryView {
  code: string;
  title: string;
  floorValue: string;
  startsAt: string;
  unit: string;
  ratioText: string;
  descriptionText: string;
  endsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    floorValue: string,
    startsAt: string,
    unit: string,
    ratioText: string,
    descriptionText: string,
    endsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.startsAt = startsAt;
    this.unit = unit;
    this.ratioText = ratioText;
    this.descriptionText = descriptionText;
    this.endsAtText = endsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyTierEntryView(item: LegacyTierEntry): LegacyTierEntryView {
  return new LegacyTierEntryView(
    item.code,
    item.title,
    item.floorValue.toFixed(2),
    String(item.startsAt),
    item.unit,
    item.ratio.toFixed(2),
    item.description,
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyTierEntryViews(items: LegacyTierEntry[]): LegacyTierEntryView[] {
  const views: LegacyTierEntryView[] = [];
  for (const item of items) {
    views.push(toLegacyTierEntryView(item));
  }
  return views;
}

export function sumLegacyTierEntryView(view: LegacyTierEntryView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedFloorValue + parsedStartsAt + parsedRatio;
}
