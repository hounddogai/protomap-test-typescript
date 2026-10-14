import * as text from "../../../../kit/text.js";
import { RollingJourneyBaseline } from "./rolling-journey-baseline.js";

/** How screens and exports show a rolling journey baseline. */
export class RollingJourneyBaselineView {
  code: string;
  titleText: string;
  revisionText: string;
  priority: string;
  minimum: string;
  localeText: string;
  contactEmail: string;
  floorValue: string;
  active: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revisionText: string,
    priority: string,
    minimum: string,
    localeText: string,
    contactEmail: string,
    floorValue: string,
    active: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revisionText = revisionText;
    this.priority = priority;
    this.minimum = minimum;
    this.localeText = localeText;
    this.contactEmail = contactEmail;
    this.floorValue = floorValue;
    this.active = active;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toRollingJourneyBaselineView(item: RollingJourneyBaseline): RollingJourneyBaselineView {
  return new RollingJourneyBaselineView(
    item.code,
    item.title,
    String(item.revision),
    String(item.priority),
    item.minimum.toFixed(2),
    text.truncate(item.locale, 40),
    text.truncate(item.contactEmail, 120),
    item.floorValue.toFixed(2),
    `${item.active}`,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingJourneyBaselineViews(items: RollingJourneyBaseline[]): RollingJourneyBaselineView[] {
  const views: RollingJourneyBaselineView[] = [];
  for (const item of items) {
    views.push(toRollingJourneyBaselineView(item));
  }
  return views;
}

export function sumRollingJourneyBaselineView(view: RollingJourneyBaselineView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedRevision + parsedPriority + parsedMinimum;
}
