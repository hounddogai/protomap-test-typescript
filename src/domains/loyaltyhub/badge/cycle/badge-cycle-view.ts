import * as text from "../../../../kit/text.js";
import { BadgeCycle } from "./badge-cycle.js";

/** How screens and exports show a badge cycle. */
export class BadgeCycleView {
  codeText: string;
  label: string;
  minimum: string;
  sequence: string;
  description: string;
  timezone: string;
  regionText: string;
  openRateText: string;
  updatedAtText: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    minimum: string,
    sequence: string,
    description: string,
    timezone: string,
    regionText: string,
    openRateText: string,
    updatedAtText: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.minimum = minimum;
    this.sequence = sequence;
    this.description = description;
    this.timezone = timezone;
    this.regionText = regionText;
    this.openRateText = openRateText;
    this.updatedAtText = updatedAtText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeCycleView(item: BadgeCycle): BadgeCycleView {
  return new BadgeCycleView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    String(item.sequence),
    item.description,
    item.timezone,
    text.truncate(item.region, 40),
    item.openRate.toFixed(2),
    String(item.updatedAt),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeCycleViews(items: BadgeCycle[]): BadgeCycleView[] {
  const views: BadgeCycleView[] = [];
  for (const item of items) {
    views.push(toBadgeCycleView(item));
  }
  return views;
}

export function sumBadgeCycleView(view: BadgeCycleView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedMinimum + parsedSequence + parsedOpenRate;
}
