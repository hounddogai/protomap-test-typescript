import * as text from "../../../../kit/text.js";
import { EnrollmentDigest } from "./enrollment-digest.js";

/** How screens and exports show a enrollment digest. */
export class EnrollmentDigestView {
  code: string;
  label: string;
  region: string;
  nameText: string;
  margin: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    region: string,
    nameText: string,
    margin: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.nameText = nameText;
    this.margin = margin;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentDigestView(item: EnrollmentDigest): EnrollmentDigestView {
  return new EnrollmentDigestView(
    item.code,
    item.label,
    text.truncate(item.region, 80),
    item.name,
    item.margin.toFixed(2),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentDigestViews(items: EnrollmentDigest[]): EnrollmentDigestView[] {
  const views: EnrollmentDigestView[] = [];
  for (const item of items) {
    views.push(toEnrollmentDigestView(item));
  }
  return views;
}

export function sumEnrollmentDigestView(view: EnrollmentDigestView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedMargin + parsedLimit;
}
