import * as text from "../../../../kit/text.js";
import { LenientDeflectionSegment } from "./lenient-deflection-segment.js";

/** How screens and exports show a lenient deflection segment. */
export class LenientDeflectionSegmentView {
  code: string;
  name: string;
  description: string;
  unit: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    description: string,
    unit: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.unit = unit;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientDeflectionSegmentView(item: LenientDeflectionSegment): LenientDeflectionSegmentView {
  return new LenientDeflectionSegmentView(
    text.truncate(item.code, 40),
    item.name,
    item.description,
    item.unit,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientDeflectionSegmentViews(items: LenientDeflectionSegment[]): LenientDeflectionSegmentView[] {
  const views: LenientDeflectionSegmentView[] = [];
  for (const item of items) {
    views.push(toLenientDeflectionSegmentView(item));
  }
  return views;
}

export function sumLenientDeflectionSegmentView(view: LenientDeflectionSegmentView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedFloorValue;
}
