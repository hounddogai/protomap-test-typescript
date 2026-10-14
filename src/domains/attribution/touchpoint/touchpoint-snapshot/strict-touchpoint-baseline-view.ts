import * as text from "../../../../kit/text.js";
import { StrictTouchpointBaseline } from "./strict-touchpoint-baseline.js";

/** How screens and exports show a strict touchpoint baseline. */
export class StrictTouchpointBaselineView {
  code: string;
  name: string;
  externalRef: string;
  label: string;
  startsAt: string;
  cohort: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    label: string,
    startsAt: string,
    cohort: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.label = label;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictTouchpointBaselineView(item: StrictTouchpointBaseline): StrictTouchpointBaselineView {
  return new StrictTouchpointBaselineView(
    item.code,
    item.name,
    item.externalRef,
    text.truncate(item.label, 120),
    String(item.startsAt),
    text.truncate(item.cohort, 40),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictTouchpointBaselineViews(items: StrictTouchpointBaseline[]): StrictTouchpointBaselineView[] {
  const views: StrictTouchpointBaselineView[] = [];
  for (const item of items) {
    views.push(toStrictTouchpointBaselineView(item));
  }
  return views;
}

export function sumStrictTouchpointBaselineView(view: StrictTouchpointBaselineView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedStartsAt + parsedRate;
}
