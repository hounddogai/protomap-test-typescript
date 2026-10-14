import * as text from "../../../../kit/text.js";
import { CreativeSegment } from "./creative-segment.js";

/** How screens and exports show a creative segment. */
export class CreativeSegmentView {
  code: string;
  titleText: string;
  notes: string;
  impressions: string;
  windowDays: string;
  frequencyCap: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    notes: string,
    impressions: string,
    windowDays: string,
    frequencyCap: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.notes = notes;
    this.impressions = impressions;
    this.windowDays = windowDays;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeSegmentView(item: CreativeSegment): CreativeSegmentView {
  return new CreativeSegmentView(
    item.code,
    text.truncate(item.title, 120),
    item.notes,
    String(item.impressions),
    String(item.windowDays),
    String(item.frequencyCap),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeSegmentViews(items: CreativeSegment[]): CreativeSegmentView[] {
  const views: CreativeSegmentView[] = [];
  for (const item of items) {
    views.push(toCreativeSegmentView(item));
  }
  return views;
}

export function sumCreativeSegmentView(view: CreativeSegmentView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedImpressions + parsedWindowDays + parsedFrequencyCap;
}
