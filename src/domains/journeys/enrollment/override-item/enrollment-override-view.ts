import * as text from "../../../../kit/text.js";
import { EnrollmentOverride } from "./enrollment-override.js";

/** How screens and exports show a enrollment override. */
export class EnrollmentOverrideView {
  code: string;
  title: string;
  country: string;
  ratio: string;
  durationMinutes: string;
  frequencyCap: string;
  cost: string;
  externalRef: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    country: string,
    ratio: string,
    durationMinutes: string,
    frequencyCap: string,
    cost: string,
    externalRef: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.externalRef = externalRef;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentOverrideView(item: EnrollmentOverride): EnrollmentOverrideView {
  return new EnrollmentOverrideView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 80),
    text.truncate(item.country, 40),
    item.ratio.toFixed(2),
    String(item.durationMinutes),
    String(item.frequencyCap),
    item.cost.toFixed(2),
    text.truncate(item.externalRef, 64),
    text.truncate(item.region, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentOverrideViews(items: EnrollmentOverride[]): EnrollmentOverrideView[] {
  const views: EnrollmentOverrideView[] = [];
  for (const item of items) {
    views.push(toEnrollmentOverrideView(item));
  }
  return views;
}

export function sumEnrollmentOverrideView(view: EnrollmentOverrideView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedRatio + parsedDurationMinutes + parsedFrequencyCap;
}
