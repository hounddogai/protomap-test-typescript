import * as text from "../../../../kit/text.js";
import { FlightClaim } from "./flight-claim.js";

/** How screens and exports show a flight claim. */
export class FlightClaimView {
  code: string;
  titleText: string;
  source: string;
  startsAtText: string;
  label: string;
  retriesText: string;
  weight: string;
  score: string;
  unitText: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    source: string,
    startsAtText: string,
    label: string,
    retriesText: string,
    weight: string,
    score: string,
    unitText: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.source = source;
    this.startsAtText = startsAtText;
    this.label = label;
    this.retriesText = retriesText;
    this.weight = weight;
    this.score = score;
    this.unitText = unitText;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toFlightClaimView(item: FlightClaim): FlightClaimView {
  return new FlightClaimView(
    item.code,
    item.title,
    item.source,
    String(item.startsAt),
    text.truncate(item.label, 120),
    String(item.retries),
    item.weight.toFixed(2),
    item.score.toFixed(2),
    item.unit,
    item.summary,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightClaimViews(items: FlightClaim[]): FlightClaimView[] {
  const views: FlightClaimView[] = [];
  for (const item of items) {
    views.push(toFlightClaimView(item));
  }
  return views;
}

export function sumFlightClaimView(view: FlightClaimView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedStartsAt + parsedRetries + parsedWeight;
}
