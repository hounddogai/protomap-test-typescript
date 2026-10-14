import * as text from "../../../../kit/text.js";
import { JourneyBaseline } from "./journey-baseline.js";

/** How screens and exports show a journey baseline. */
export class JourneyBaselineView {
  codeText: string;
  title: string;
  source: string;
  startsAt: string;
  archived: string;
  frequencyCapText: string;
  limit: string;
  cost: string;
  minimum: string;
  name: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    source: string,
    startsAt: string,
    archived: string,
    frequencyCapText: string,
    limit: string,
    cost: string,
    minimum: string,
    name: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.source = source;
    this.startsAt = startsAt;
    this.archived = archived;
    this.frequencyCapText = frequencyCapText;
    this.limit = limit;
    this.cost = cost;
    this.minimum = minimum;
    this.name = name;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyBaselineView(item: JourneyBaseline): JourneyBaselineView {
  return new JourneyBaselineView(
    item.code,
    text.truncate(item.title, 64),
    item.source,
    String(item.startsAt),
    `${item.archived}`,
    String(item.frequencyCap),
    String(item.limit),
    item.cost.toFixed(2),
    item.minimum.toFixed(2),
    text.truncate(item.name, 120),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyBaselineViews(items: JourneyBaseline[]): JourneyBaselineView[] {
  const views: JourneyBaselineView[] = [];
  for (const item of items) {
    views.push(toJourneyBaselineView(item));
  }
  return views;
}

export function sumJourneyBaselineView(view: JourneyBaselineView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedStartsAt + parsedFrequencyCap + parsedLimit;
}
