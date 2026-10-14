import * as text from "../../../../kit/text.js";
import { FlightDigest } from "./flight-digest.js";

/** How screens and exports show a flight digest. */
export class FlightDigestView {
  codeText: string;
  name: string;
  reviewerText: string;
  audienceId: string;
  ratioText: string;
  maximum: string;
  thresholdText: string;
  approved: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    reviewerText: string,
    audienceId: string,
    ratioText: string,
    maximum: string,
    thresholdText: string,
    approved: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.reviewerText = reviewerText;
    this.audienceId = audienceId;
    this.ratioText = ratioText;
    this.maximum = maximum;
    this.thresholdText = thresholdText;
    this.approved = approved;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toFlightDigestView(item: FlightDigest): FlightDigestView {
  return new FlightDigestView(
    item.code,
    item.name,
    item.reviewer,
    text.truncate(item.audienceId, 40),
    item.ratio.toFixed(2),
    item.maximum.toFixed(2),
    item.threshold.toFixed(2),
    `${item.approved}`,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightDigestViews(items: FlightDigest[]): FlightDigestView[] {
  const views: FlightDigestView[] = [];
  for (const item of items) {
    views.push(toFlightDigestView(item));
  }
  return views;
}

export function sumFlightDigestView(view: FlightDigestView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedRatio + parsedMaximum + parsedThreshold;
}
