import { PrimarySenderSegment } from "./primary-sender-segment.js";

/** How screens and exports show a primary sender segment. */
export class PrimarySenderSegmentView {
  code: string;
  label: string;
  utmSourceText: string;
  sourceText: string;
  windowDays: string;
  contactEmail: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSourceText: string,
    sourceText: string,
    windowDays: string,
    contactEmail: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSourceText = utmSourceText;
    this.sourceText = sourceText;
    this.windowDays = windowDays;
    this.contactEmail = contactEmail;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySenderSegmentView(item: PrimarySenderSegment): PrimarySenderSegmentView {
  return new PrimarySenderSegmentView(
    item.code,
    item.label,
    item.utmSource,
    item.source,
    String(item.windowDays),
    item.contactEmail,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySenderSegmentViews(items: PrimarySenderSegment[]): PrimarySenderSegmentView[] {
  const views: PrimarySenderSegmentView[] = [];
  for (const item of items) {
    views.push(toPrimarySenderSegmentView(item));
  }
  return views;
}

export function sumPrimarySenderSegmentView(view: PrimarySenderSegmentView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedWindowDays;
}
