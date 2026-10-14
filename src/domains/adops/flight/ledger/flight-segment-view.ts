import * as text from "../../../../kit/text.js";
import { FlightSegment } from "./flight-segment.js";

/** How screens and exports show a flight segment. */
export class FlightSegmentView {
  code: string;
  labelText: string;
  variantText: string;
  ownerIdText: string;
  audienceId: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    variantText: string,
    ownerIdText: string,
    audienceId: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.variantText = variantText;
    this.ownerIdText = ownerIdText;
    this.audienceId = audienceId;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toFlightSegmentView(item: FlightSegment): FlightSegmentView {
  return new FlightSegmentView(
    item.code,
    item.label,
    text.truncate(item.variant, 40),
    item.ownerId,
    text.truncate(item.audienceId, 64),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightSegmentViews(items: FlightSegment[]): FlightSegmentView[] {
  const views: FlightSegmentView[] = [];
  for (const item of items) {
    views.push(toFlightSegmentView(item));
  }
  return views;
}

export function sumFlightSegmentView(view: FlightSegmentView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedScore;
}
