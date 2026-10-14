import { LevelRequest } from "./level-request.js";

/** How screens and exports show a level request. */
export class LevelRequestView {
  code: string;
  label: string;
  checksum: string;
  segment: string;
  minimum: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    checksum: string,
    segment: string,
    minimum: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.segment = segment;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toLevelRequestView(item: LevelRequest): LevelRequestView {
  return new LevelRequestView(
    item.code,
    item.label,
    item.checksum,
    item.segment,
    item.minimum.toFixed(2),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelRequestViews(items: LevelRequest[]): LevelRequestView[] {
  const views: LevelRequestView[] = [];
  for (const item of items) {
    views.push(toLevelRequestView(item));
  }
  return views;
}

export function sumLevelRequestView(view: LevelRequestView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedMinimum + parsedWindowDays;
}
