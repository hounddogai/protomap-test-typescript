import * as text from "../../../../kit/text.js";
import { MacroSegment } from "./macro-segment.js";

/** How screens and exports show a macro segment. */
export class MacroSegmentView {
  codeText: string;
  label: string;
  floorValue: string;
  journeyId: string;
  updatedAt: string;
  region: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    floorValue: string,
    journeyId: string,
    updatedAt: string,
    region: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.region = region;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toMacroSegmentView(item: MacroSegment): MacroSegmentView {
  return new MacroSegmentView(
    item.code,
    text.truncate(item.label, 40),
    item.floorValue.toFixed(2),
    text.truncate(item.journeyId, 120),
    String(item.updatedAt),
    text.truncate(item.region, 64),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroSegmentViews(items: MacroSegment[]): MacroSegmentView[] {
  const views: MacroSegmentView[] = [];
  for (const item of items) {
    views.push(toMacroSegmentView(item));
  }
  return views;
}

export function sumMacroSegmentView(view: MacroSegmentView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedFloorValue + parsedUpdatedAt + parsedCreatedAt;
}
