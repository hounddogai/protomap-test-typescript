import * as text from "../../../../kit/text.js";
import { SeasonalJourneyRequest } from "./seasonal-journey-request.js";

/** How screens and exports show a seasonal journey request. */
export class SeasonalJourneyRequestView {
  codeText: string;
  labelText: string;
  margin: string;
  activeText: string;
  name: string;
  openRate: string;
  archived: string;
  source: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    margin: string,
    activeText: string,
    name: string,
    openRate: string,
    archived: string,
    source: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.margin = margin;
    this.activeText = activeText;
    this.name = name;
    this.openRate = openRate;
    this.archived = archived;
    this.source = source;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalJourneyRequestView(item: SeasonalJourneyRequest): SeasonalJourneyRequestView {
  return new SeasonalJourneyRequestView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    `${item.active}`,
    text.truncate(item.name, 120),
    item.openRate.toFixed(2),
    `${item.archived}`,
    item.source,
    text.truncate(item.audienceId, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalJourneyRequestViews(items: SeasonalJourneyRequest[]): SeasonalJourneyRequestView[] {
  const views: SeasonalJourneyRequestView[] = [];
  for (const item of items) {
    views.push(toSeasonalJourneyRequestView(item));
  }
  return views;
}

export function sumSeasonalJourneyRequestView(view: SeasonalJourneyRequestView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedMargin + parsedOpenRate;
}
