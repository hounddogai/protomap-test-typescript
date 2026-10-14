import * as text from "../../../../kit/text.js";
import { SeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

/** How screens and exports show a seasonal subscription segment. */
export class SeasonalSubscriptionSegmentView {
  code: string;
  name: string;
  description: string;
  createdAt: string;
  audienceId: string;
  floorValue: string;
  conversionRate: string;
  versionText: string;
  ceiling: string;
  sendAt: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    description: string,
    createdAt: string,
    audienceId: string,
    floorValue: string,
    conversionRate: string,
    versionText: string,
    ceiling: string,
    sendAt: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.versionText = versionText;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSubscriptionSegmentView(item: SeasonalSubscriptionSegment): SeasonalSubscriptionSegmentView {
  return new SeasonalSubscriptionSegmentView(
    item.code,
    item.name,
    item.description,
    String(item.createdAt),
    text.truncate(item.audienceId, 40),
    item.floorValue.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.version),
    item.ceiling.toFixed(2),
    String(item.sendAt),
    text.truncate(item.source, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSubscriptionSegmentViews(items: SeasonalSubscriptionSegment[]): SeasonalSubscriptionSegmentView[] {
  const views: SeasonalSubscriptionSegmentView[] = [];
  for (const item of items) {
    views.push(toSeasonalSubscriptionSegmentView(item));
  }
  return views;
}

export function sumSeasonalSubscriptionSegmentView(view: SeasonalSubscriptionSegmentView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedCreatedAt + parsedFloorValue + parsedConversionRate;
}
