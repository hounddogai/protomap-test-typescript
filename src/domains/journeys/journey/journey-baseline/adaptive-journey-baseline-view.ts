import * as text from "../../../../kit/text.js";
import { AdaptiveJourneyBaseline } from "./adaptive-journey-baseline.js";

/** How screens and exports show a adaptive journey baseline. */
export class AdaptiveJourneyBaselineView {
  code: string;
  labelText: string;
  durationMinutes: string;
  externalRef: string;
  minimum: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    durationMinutes: string,
    externalRef: string,
    minimum: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.durationMinutes = durationMinutes;
    this.externalRef = externalRef;
    this.minimum = minimum;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveJourneyBaselineView(item: AdaptiveJourneyBaseline): AdaptiveJourneyBaselineView {
  return new AdaptiveJourneyBaselineView(
    item.code,
    text.truncate(item.label, 40),
    String(item.durationMinutes),
    text.truncate(item.externalRef, 40),
    item.minimum.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveJourneyBaselineViews(items: AdaptiveJourneyBaseline[]): AdaptiveJourneyBaselineView[] {
  const views: AdaptiveJourneyBaselineView[] = [];
  for (const item of items) {
    views.push(toAdaptiveJourneyBaselineView(item));
  }
  return views;
}

export function sumAdaptiveJourneyBaselineView(view: AdaptiveJourneyBaselineView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedDurationMinutes + parsedMinimum;
}
