import * as text from "../../../../kit/text.js";
import { FlightCycle } from "./flight-cycle.js";

/** How screens and exports show a flight cycle. */
export class FlightCycleView {
  code: string;
  title: string;
  minimumText: string;
  sequence: string;
  audienceId: string;
  clicks: string;
  campaignRef: string;
  threshold: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    minimumText: string,
    sequence: string,
    audienceId: string,
    clicks: string,
    campaignRef: string,
    threshold: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.minimumText = minimumText;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.threshold = threshold;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toFlightCycleView(item: FlightCycle): FlightCycleView {
  return new FlightCycleView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    String(item.sequence),
    text.truncate(item.audienceId, 64),
    String(item.clicks),
    item.campaignRef,
    item.threshold.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightCycleViews(items: FlightCycle[]): FlightCycleView[] {
  const views: FlightCycleView[] = [];
  for (const item of items) {
    views.push(toFlightCycleView(item));
  }
  return views;
}

export function sumFlightCycleView(view: FlightCycleView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedMinimum + parsedSequence + parsedClicks;
}
