import { ModelSegment } from "./model-segment.js";

/** How screens and exports show a model segment. */
export class ModelSegmentView {
  codeText: string;
  title: string;
  locale: string;
  openRate: string;
  journeyId: string;
  audienceId: string;
  unit: string;
  createdAt: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    openRate: string,
    journeyId: string,
    audienceId: string,
    unit: string,
    createdAt: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.openRate = openRate;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.unit = unit;
    this.createdAt = createdAt;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toModelSegmentView(item: ModelSegment): ModelSegmentView {
  return new ModelSegmentView(
    item.code,
    item.title,
    item.locale,
    item.openRate.toFixed(2),
    item.journeyId,
    item.audienceId,
    item.unit,
    String(item.createdAt),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelSegmentViews(items: ModelSegment[]): ModelSegmentView[] {
  const views: ModelSegmentView[] = [];
  for (const item of items) {
    views.push(toModelSegmentView(item));
  }
  return views;
}

export function sumModelSegmentView(view: ModelSegmentView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedOpenRate + parsedCreatedAt + parsedFloorValue;
}
