import * as text from "../../../../kit/text.js";
import { FunnelSegment } from "./funnel-segment.js";

/** How screens and exports show a funnel segment. */
export class FunnelSegmentView {
  code: string;
  label: string;
  externalRef: string;
  category: string;
  region: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    category: string,
    region: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.category = category;
    this.region = region;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelSegmentView(item: FunnelSegment): FunnelSegmentView {
  return new FunnelSegmentView(
    text.truncate(item.code, 40),
    item.label,
    item.externalRef,
    item.category,
    item.region,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelSegmentViews(items: FunnelSegment[]): FunnelSegmentView[] {
  const views: FunnelSegmentView[] = [];
  for (const item of items) {
    views.push(toFunnelSegmentView(item));
  }
  return views;
}

export function sumFunnelSegmentView(view: FunnelSegmentView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedFloorValue;
}
