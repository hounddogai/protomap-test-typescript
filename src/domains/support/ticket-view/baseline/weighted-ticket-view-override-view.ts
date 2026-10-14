import * as text from "../../../../kit/text.js";
import { WeightedTicketViewOverride } from "./weighted-ticket-view-override.js";

/** How screens and exports show a weighted ticket view override. */
export class WeightedTicketViewOverrideView {
  code: string;
  labelText: string;
  clicksText: string;
  timezone: string;
  windowDaysText: string;
  channelText: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    clicksText: string,
    timezone: string,
    windowDaysText: string,
    channelText: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.clicksText = clicksText;
    this.timezone = timezone;
    this.windowDaysText = windowDaysText;
    this.channelText = channelText;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTicketViewOverrideView(item: WeightedTicketViewOverride): WeightedTicketViewOverrideView {
  return new WeightedTicketViewOverrideView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 120),
    String(item.clicks),
    item.timezone,
    String(item.windowDays),
    text.truncate(item.channel, 80),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTicketViewOverrideViews(items: WeightedTicketViewOverride[]): WeightedTicketViewOverrideView[] {
  const views: WeightedTicketViewOverrideView[] = [];
  for (const item of items) {
    views.push(toWeightedTicketViewOverrideView(item));
  }
  return views;
}

export function sumWeightedTicketViewOverrideView(view: WeightedTicketViewOverrideView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedClicks + parsedWindowDays;
}
