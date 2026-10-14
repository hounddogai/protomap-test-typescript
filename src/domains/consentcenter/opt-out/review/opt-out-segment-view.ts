import * as text from "../../../../kit/text.js";
import { OptOutSegment } from "./opt-out-segment.js";

/** How screens and exports show a opt out segment. */
export class OptOutSegmentView {
  code: string;
  title: string;
  cohortText: string;
  contactEmailText: string;
  ceiling: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohortText: string,
    contactEmailText: string,
    ceiling: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohortText = cohortText;
    this.contactEmailText = contactEmailText;
    this.ceiling = ceiling;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutSegmentView(item: OptOutSegment): OptOutSegmentView {
  return new OptOutSegmentView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.cohort, 80),
    item.contactEmail,
    item.ceiling.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutSegmentViews(items: OptOutSegment[]): OptOutSegmentView[] {
  const views: OptOutSegmentView[] = [];
  for (const item of items) {
    views.push(toOptOutSegmentView(item));
  }
  return views;
}

export function sumOptOutSegmentView(view: OptOutSegmentView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
