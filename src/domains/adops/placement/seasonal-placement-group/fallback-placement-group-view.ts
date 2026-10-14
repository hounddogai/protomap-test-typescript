import { FallbackPlacementGroup } from "./fallback-placement-group.js";

/** How screens and exports show a fallback placement group. */
export class FallbackPlacementGroupView {
  codeText: string;
  titleText: string;
  journeyId: string;
  startsAtText: string;
  segmentText: string;
  conversionRate: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    journeyId: string,
    startsAtText: string,
    segmentText: string,
    conversionRate: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.journeyId = journeyId;
    this.startsAtText = startsAtText;
    this.segmentText = segmentText;
    this.conversionRate = conversionRate;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPlacementGroupView(item: FallbackPlacementGroup): FallbackPlacementGroupView {
  return new FallbackPlacementGroupView(
    item.code,
    item.title,
    item.journeyId,
    String(item.startsAt),
    item.segment,
    item.conversionRate.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPlacementGroupViews(items: FallbackPlacementGroup[]): FallbackPlacementGroupView[] {
  const views: FallbackPlacementGroupView[] = [];
  for (const item of items) {
    views.push(toFallbackPlacementGroupView(item));
  }
  return views;
}

export function sumFallbackPlacementGroupView(view: FallbackPlacementGroupView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedStartsAt + parsedConversionRate + parsedFloorValue;
}
