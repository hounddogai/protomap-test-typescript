import * as text from "../../../../kit/text.js";
import { ConversionSegment } from "./conversion-segment.js";

/** How screens and exports show a conversion segment. */
export class ConversionSegmentView {
  codeText: string;
  label: string;
  notes: string;
  visible: string;
  campaignRef: string;
  checksum: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    notes: string,
    visible: string,
    campaignRef: string,
    checksum: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.notes = notes;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.checksum = checksum;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toConversionSegmentView(item: ConversionSegment): ConversionSegmentView {
  return new ConversionSegmentView(
    item.code,
    item.label,
    text.truncate(item.notes, 120),
    `${item.visible}`,
    item.campaignRef,
    item.checksum,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionSegmentViews(items: ConversionSegment[]): ConversionSegmentView[] {
  const views: ConversionSegmentView[] = [];
  for (const item of items) {
    views.push(toConversionSegmentView(item));
  }
  return views;
}

export function sumConversionSegmentView(view: ConversionSegmentView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCreatedAt;
}
