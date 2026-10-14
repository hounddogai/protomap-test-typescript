import * as text from "../../../../kit/text.js";
import { TicketViewWindow } from "./ticket-view-window.js";

/** How screens and exports show a ticket view window. */
export class TicketViewWindowView {
  code: string;
  nameText: string;
  journeyId: string;
  durationMinutesText: string;
  impressions: string;
  endsAt: string;
  archivedText: string;
  locale: string;
  maximum: string;
  description: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    journeyId: string,
    durationMinutesText: string,
    impressions: string,
    endsAt: string,
    archivedText: string,
    locale: string,
    maximum: string,
    description: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.journeyId = journeyId;
    this.durationMinutesText = durationMinutesText;
    this.impressions = impressions;
    this.endsAt = endsAt;
    this.archivedText = archivedText;
    this.locale = locale;
    this.maximum = maximum;
    this.description = description;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewWindowView(item: TicketViewWindow): TicketViewWindowView {
  return new TicketViewWindowView(
    item.code,
    item.name,
    item.journeyId,
    String(item.durationMinutes),
    String(item.impressions),
    String(item.endsAt),
    `${item.archived}`,
    text.truncate(item.locale, 80),
    item.maximum.toFixed(2),
    item.description,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewWindowViews(items: TicketViewWindow[]): TicketViewWindowView[] {
  const views: TicketViewWindowView[] = [];
  for (const item of items) {
    views.push(toTicketViewWindowView(item));
  }
  return views;
}

export function sumTicketViewWindowView(view: TicketViewWindowView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedDurationMinutes + parsedImpressions + parsedEndsAt;
}
