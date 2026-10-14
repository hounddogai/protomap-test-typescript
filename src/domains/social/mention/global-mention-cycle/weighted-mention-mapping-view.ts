import * as text from "../../../../kit/text.js";
import { WeightedMentionMapping } from "./weighted-mention-mapping.js";

/** How screens and exports show a weighted mention mapping. */
export class WeightedMentionMappingView {
  codeText: string;
  titleText: string;
  floorValue: string;
  localeText: string;
  segmentText: string;
  contactEmail: string;
  journeyId: string;
  nameText: string;
  source: string;
  visibleText: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    floorValue: string,
    localeText: string,
    segmentText: string,
    contactEmail: string,
    journeyId: string,
    nameText: string,
    source: string,
    visibleText: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.floorValue = floorValue;
    this.localeText = localeText;
    this.segmentText = segmentText;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.nameText = nameText;
    this.source = source;
    this.visibleText = visibleText;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedMentionMappingView(item: WeightedMentionMapping): WeightedMentionMappingView {
  return new WeightedMentionMappingView(
    item.code,
    item.title,
    item.floorValue.toFixed(2),
    item.locale,
    item.segment,
    item.contactEmail,
    item.journeyId,
    text.truncate(item.name, 40),
    text.truncate(item.source, 40),
    `${item.visible}`,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedMentionMappingViews(items: WeightedMentionMapping[]): WeightedMentionMappingView[] {
  const views: WeightedMentionMappingView[] = [];
  for (const item of items) {
    views.push(toWeightedMentionMappingView(item));
  }
  return views;
}

export function sumWeightedMentionMappingView(view: WeightedMentionMappingView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedFloorValue + parsedImpressions;
}
