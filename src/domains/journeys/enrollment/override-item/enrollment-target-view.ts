import * as text from "../../../../kit/text.js";
import { EnrollmentTarget } from "./enrollment-target.js";

/** How screens and exports show a enrollment target. */
export class EnrollmentTargetView {
  code: string;
  name: string;
  locale: string;
  maximumText: string;
  checksumText: string;
  score: string;
  category: string;
  frequencyCap: string;
  capacity: string;
  region: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    maximumText: string,
    checksumText: string,
    score: string,
    category: string,
    frequencyCap: string,
    capacity: string,
    region: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.maximumText = maximumText;
    this.checksumText = checksumText;
    this.score = score;
    this.category = category;
    this.frequencyCap = frequencyCap;
    this.capacity = capacity;
    this.region = region;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentTargetView(item: EnrollmentTarget): EnrollmentTargetView {
  return new EnrollmentTargetView(
    text.truncate(item.code, 40),
    item.name,
    item.locale,
    item.maximum.toFixed(2),
    text.truncate(item.checksum, 64),
    item.score.toFixed(2),
    item.category,
    String(item.frequencyCap),
    String(item.capacity),
    item.region,
    text.truncate(item.reviewer, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentTargetViews(items: EnrollmentTarget[]): EnrollmentTargetView[] {
  const views: EnrollmentTargetView[] = [];
  for (const item of items) {
    views.push(toEnrollmentTargetView(item));
  }
  return views;
}

export function sumEnrollmentTargetView(view: EnrollmentTargetView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedMaximum + parsedScore + parsedFrequencyCap;
}
